from django.http import HttpResponse
from django.template import Context, loader
from django.views.decorators.csrf import csrf_exempt # TODO don't use this
import json, sys, pprint, os, csv
import cPickle as pickle
import datetime, random
from django.shortcuts import redirect
from collections import Counter

import networkx as nx
from networkx.readwrite import json_graph

def index(request):
    t = loader.get_template("index.html")
    c = Context({})

    return HttpResponse(t.render(c))

@csrf_exempt
def view_ds(request, ds_id):

    if not ds_id:
        return HttpResponse("No data set provided.") # TODO make prettier and/or a 404

    t = loader.get_template("view.html")
    c = Context({
        'ds_id': ds_id,
    })
   
    return HttpResponse(t.render(c)) 

def upload_file(request):
    f = request.FILES['ds']

    # little bit of hacking...
    format_type = 'json'
    try:
        ds = json.load(f)
    except:
        rows = csv.reader(f)
        ds = list()
        names = list()
        for row in rows:
            if len(names) == 0:
                for v in row:
                    names.append(v)
            else:
                idx = 0
                cur = dict()
                for v in row:
                    cur[names[idx]] = v
                    idx += 1
                ds.append(cur)
        format_type = 'csv'

    # Create network
    G = nx.Graph()

    # create date-centered / random id. not guaranteed to be unique. TODO change for scale.
    now = datetime.datetime.now()
    ds_id = "%d%d%d%d%d%d.%d" % (now.year, now.month, now.day, now.hour, now.minute, now.second, random.randint(0, 100000))

    # known formats.
    # based on collab2008.json
    if (type(ds) == type(dict()) and 
        'links' in ds and
        'nodes' in ds and
        len(ds['links']) > 0 and 
        len(ds['nodes']) > 0):
        idx = 0
        for node in ds['nodes']:
            G.add_node(idx, country_code=node['id'])
            idx += 1
        for link in ds['links']:
            G.add_edge(link['source'], link['target'], weight=link['weight'])

    # based on elena's airbnb data, formatted as csv, with columns:
    # ego_name, ego_lat, ego_lng, alter_name, alter_lat, alter_lng, weight
    elif (type(ds) == type(list()) and
          type(ds[0]) == type(dict()) and
          'ego_name' in ds[0] and
          'alter_name' in ds[0]):
        node_names = set()
        name_to_ll = dict()
        for d in ds:
            node_names.add(d['ego_name'])
            node_names.add(d['alter_name'])
            name_to_ll[d['ego_name']] = {
                'lat': d['ego_lat'],
                'lng': d['ego_lng']}
            name_to_ll[d['alter_name']] = {
                'lat': d['alter_lat'],
                'lng': d['alter_lng']}

        nodemap = dict()
        idx = 0
        for node_name in node_names:
            if node_name not in nodemap:
                G.add_node(idx, name=node_name, lat=name_to_ll[node_name]['lat'], lng=name_to_ll[node_name]['lng'])
                nodemap[node_name] = idx
                idx += 1

        for d in ds:
            G.add_edge(nodemap[d['ego_name']], nodemap[d['alter_name']], weight=int(d['weight']))
    else:
        return "ERROR_UNKNOWN_FORMAT"

    # Make sure that *every node* has a lat/lng
    no_geo = [] # maintain list of nodes removed
    ccode_to_ll = pickle.load(open('DATASETS/code_to_latlng.pkl', 'r'))
    for idx in G.node:
        # todo use HttpResponseBadRequest if no lat/lng exists
        if 'lat' not in G.node[idx] or 'lng' not in G.node[idx]:
            if 'country_code' in G.node[idx] and G.node[idx]['country_code'] in ccode_to_ll:
                c = G.node[idx]['country_code']
                G.node[idx]['lat'] = ccode_to_ll[c]['lat']
                G.node[idx]['lng'] = ccode_to_ll[c]['lng']
            else:
                no_geo.append(idx)

    # remove nodes with missing geo info
    for idx in no_geo:
        G.remove_node(idx)

    # Add *EXTRA* data. Not always guaranteed to be returned.
    ctor = pickle.load(open('DATASETS/country_to_continent.pkl', 'r'))
    code_to_country = pickle.load(open('DATASETS/code_to_country.pkl', 'r'))

    pp = pprint.PrettyPrinter(stream=sys.stderr)
    #pp.pprint(G.nodes(data=True))
    #pp.pprint(G.edges(data=True))

    closeness_vitality = nx.closeness_vitality(G)
    pagerank = nx.pagerank(G)
    degree_centrality = nx.degree_centrality(G)
    average_neighbor_degree = nx.average_neighbor_degree(G)
    for idx in G.node:
        if 'country_code' in G.node[idx] and G.node[idx]['country_code'] in ctor:
            G.node[idx]['region'] = ctor[G.node[idx]['country_code']]
        else:
            G.node[idx]['region'] = 'Unknown'

        if 'country_code' in G.node[idx] and G.node[idx]['country_code'] in code_to_country:
            G.node[idx]['country_name'] = code_to_country[G.node[idx]['country_code']]
        else:
            G.node[idx]['country_name'] = 'Unknown'

        G.node[idx]['closeness_vitality'] = closeness_vitality[idx]
        G.node[idx]['pagerank'] = pagerank[idx]
        G.node[idx]['degree'] = G.degree(idx)
        G.node[idx]['degree_centrality'] = degree_centrality[idx]
        G.node[idx]['average_neighbor_degree'] = average_neighbor_degree[idx]
        G.node[idx]['weight'] = G.degree(idx, 'weight')

    f = open("DATASETS/graph%s.pickle" % ds_id, 'w')
    pickle.dump(G, f)

    print >>sys.stderr, "UPLOAD COMPLETE. %d NODES IGNORED DUE TO MISSING GEO DATA." % len(no_geo)

    return ds_id

@csrf_exempt
def upload(request):
    ds_id = upload_file(request)
    return redirect("/view/%s/" % ds_id)

def get_ds(request, ds_id):
    G = pickle.load(open("DATASETS/graph%s.pickle" % ds_id, 'r'))

    pp = pprint.PrettyPrinter(stream=sys.stderr)
    if request.GET and 'json' in request.GET:
        params = json.loads(request.GET['json'])

        for filter in params['filters']:
            SG = G.subgraph(
                [n for n, attrdict in G.node.items() if
                    filter in attrdict and attrdict[filter] in params['filters'][filter]])
            G=SG

    #pp.pprint(G.nodes(data=True))
    #pp.pprint(G.edges(data=True))

    deg_dist = get_deg_dist(G)
    pageranks = get_pageranks(G)

    json_data = json_graph.node_link_data(G)
    json_data['extra_graphs'] = [
        {
            'title': 'Degree Distribution',
            'type': 'bar',
            'scale': 'linear',
            'data': deg_dist,
        },
        {
            'title': 'PageRanks',
            'type': 'bar',
            'scale': 'linear',
            'data': pageranks,
        },
    ]

    return HttpResponse(json.dumps(json_data), mimetype="application/json")

def get_pageranks(G):
    sorted_ranks = sorted([data['pagerank'] for (idx, data) in G.nodes(data=True)], reverse=True)

    idx = 0
    final = list()
    for val in sorted_ranks:
        final.append({'x': idx, 'y': val})
        idx += 1

    return final

def get_deg_dist(G):
    deg_dist = Counter()
    max_deg = 0
    for idx in G.node:
        deg = G.degree(idx)
        if deg not in deg_dist:
            deg_dist[deg] = 0
        deg_dist[deg] += 1
        if deg>max_deg:
            max_deg=deg

    r = []
    for d in range(max_deg+1):
        r.append(
            {'x': d,
             'y': deg_dist[d]
            })

    return r
