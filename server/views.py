from django.http import HttpResponse
from django.template import Context, loader
from django.views.decorators.csrf import csrf_exempt # TODO don't use this
import json, sys, pprint
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
    json_ds = json.load(f)

    ##pp = pprint.PrettyPrinter(stream=sys.stderr)
    ##pp.pprint(ds)

    # Create network
    G = nx.Graph()

    # create date-centered / random id. not guaranteed to be unique. TODO change for scale.
    now = datetime.datetime.now()
    ds_id = "%d%d%d%d%d%d.%d" % (now.year, now.month, now.day, now.hour, now.minute, now.second, random.randint(0, 100000))

    # known formats.
    if len(json_ds['links']) > 0 and len(json_ds['nodes']) > 0:
        idx = 0
        for node in json_ds['nodes']:
            G.add_node(idx, country_code=node['id'])
            idx += 1
        for link in json_ds['links']:
            G.add_edge(link['source'], link['target'], weight=link['weight'])
    else:
        return "ERROR_UNKNOWN_FORMAT"

    ctor = pickle.load(open('DATASETS/country_to_continent.pkl', 'r'))
    code_to_country = pickle.load(open('DATASETS/code_to_country.pkl', 'r'))

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

    f = open("DATASETS/graph%s.pickle" % ds_id, 'w')
    pickle.dump(G, f)

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
    pp.pprint(deg_dist)

    json_data = json_graph.node_link_data(G)
    json_data['extra_graphs'] = [
        {
            'title': 'A Test of Tests!',
            'type': 'bar',
            'scale': 'linear',
            'data': deg_dist,
        }
    ]

    return HttpResponse(json.dumps(json_data), mimetype="application/json")

def get_deg_dist(G):
    deg_dist = Counter()
    max_deg = 0
    for idx in G.node:
        deg = G.degree(idx)
        print >>sys.stderr, deg
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
