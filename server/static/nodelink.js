// This implementation is based on Mike Bostock's co-ocurrence matrix
// http://bost.ocks.org/mike/miserables/

function NodeLink() {
	// parameters
	this.margin = {top: 20, right: 10, bottom: 10, left: 20};
	this.w = 900;
	this.h = 900;
	this.r = 6;
	this.n = 100;
	this.selector = "#nodelinkview > #nodelink";

	// public properties
	this.color = null;
	this.force = null;

	this.svg = null;
	this.tooltip = null;
	this.node_group = null;
	this.link_group = null;
	this.linkedByIndex = {};
}

NodeLink.prototype.redraw = function() {
   nodelink.svg.attr("transform",
      "translate(" + d3.event.translate + ")"
      + " scale(" + d3.event.scale + ")");

}

NodeLink.prototype.init = function() {
	this.force = d3.layout.force()
		.gravity(0.1)
    	.charge(-200)
   		.linkDistance(0.5)
		.linkStrength(0.1)
   		.size([nodelink.w, nodelink.h]);

	this.tooltip = Tooltip("vis-tooltip", 230);

	this.svg = d3.select(this.selector).append("svg")
    	.attr("width", nodelink.w)
    	.attr("height", nodelink.h)
		.attr("pointer-events", "all")
 		.append('svg:g')
   		.call(d3.behavior.zoom().on("zoom", nodelink.redraw))
  		.append('svg:g');

	this.svg.append('svg:rect')
    	.attr('width', nodelink.w)
    	.attr('height', nodelink.h)
    	.attr('fill', 'white');

	this.link_group = this.svg.append("g")
		.attr('id', 'links');

	this.node_group = this.svg.append("g")
		.attr('id', 'nodes');

	this.loading = this.svg.append("text")
    .attr("x", nodelink.w / 2)
    .attr("y", nodelink.h / 2)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text("simulating. one moment please…");
}



NodeLink.prototype.loadNetwork = function(graph) {

	// moved this here so that gravity is changed depending on the size of the graph (need to test on more graphs - picked these numbers based on the two we have)
	nodelink.force.charge( function(d) {
			if  (graph.links.length > 200) {
								return -200;
					} else { return -2000; }
 			 });

	 setTimeout(function() {

	 // set the id's of the links to something we can refer to
	 for (i=0; i<graph.links.length; i++) {
		 graph.links[i].id = graph.links[i].source + "-" + graph.links[i].target;
	 }

	 nodelink.force
	     .nodes(graph.nodes)
		 .links(graph.links)
		 .start();

	 for (var i = nodelink.n * nodelink.n; i > 0; --i) nodelink.force.tick();

	 nodelink.force.stop();

	 var links = nodelink.link_group.selectAll("line")
  		.data(graph.links, function(d) { return d.id; });

	links
	   .enter().append("line");

	links
		.exit().remove();

	var otherlink = nodelink.link_group.selectAll("line")
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; })
		.attr("class", "link")
	    .style("stroke-width", 0.7);


	 var nodes = nodelink.node_group.selectAll("circle")
		.data(graph.nodes, function(d) { return d.id; });

	nodes
	  .enter().append("circle");

	nodes
		.exit().remove();

	nodes = nodelink.node_group.selectAll("circle")
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; })
		.attr("r", nodelink.r - .75)
	 	.style("fill", function(d) { return colourscale(d.region); });

	nodes.on("mouseover", function(p) {
		content = '<p>' + p.name + '</span></p>';
   		content += '<hr class="tooltip-hr">';
    	content += '<p>' + p.degree + ' links' + '; ' + Math.round(p.average_neighbor_degree) + ' avg neighbor links' + '</span></p>';
   		nodelink.tooltip.showTooltip(content,d3.event);

		nodelink.link_group.selectAll("line")
			.attr("opacity",
				function(d) {
					if  (d.source.id == p.id || d.target.id == p.id) {
								return 3;
					} else { return .5; }
				})
			.style("stroke",
				function(d) {
					if  (d.source.id == p.id || d.target.id == p.id) {
								return '#3c3c3c';
					} else { return '#ddd'; }
				}) ;

 		d3.select(this).style("stroke","black")
      	.style("stroke-width", 2.0);

	});

	nodes.on("mouseout", function(d) {
   		nodelink.tooltip.hideTooltip();
		d3.select(this).attr("class", "link")
	 	.style("stroke-width", 0.1);
		nodelink.link_group.selectAll("line")
			.attr("opacity", 0.8)
	});

	nodelink.loading.remove();

	}, 10);
}

