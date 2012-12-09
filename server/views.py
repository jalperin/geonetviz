from django.http import HttpResponse
from django.template import Context, loader
from django.views.decorators.csrf import csrf_exempt # TODO don't use this
import json, sys, pprint
import cPickle as pickle
import datetime, random
from django.shortcuts import redirect

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
        f = open("DATASETS/graph%s.pickle" % ds_id, 'w')
        pickle.dump(G, f)
    else:
        return "ERROR_UNKNOWN_FORMAT"

    return ds_id

@csrf_exempt
def upload(request):
    ds_id = upload_file(request)
    return redirect("/view/%s/" % ds_id)

def get_ds(request, ds_id):
    G = pickle.load(open("DATASETS/graph%s.pickle" % ds_id, 'r'))
    return HttpResponse(json.dumps(json_graph.node_link_data(G)), mimetype="application/json")
