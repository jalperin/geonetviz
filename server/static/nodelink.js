// This implementation is based on Mike Bostock's co-ocurrence matrix
// http://bost.ocks.org/mike/miserables/

function NodeLink() {
	// parameters
	this.margin = {top: 20, right: 10, bottom: 10, left: 20};
	this.w = 800;
	this.h = 500;
	this.r = 6;
	this.n = 100;
	this.selector = "#nodelinkview > #nodelink";

	// public properties
	this.svg = null;
	this.color = null;
	this.force = null;
}

NodeLink.prototype.redraw = function() {
   nodelink.svg.attr("transform",
      "translate(" + d3.event.translate + ")"
      + " scale(" + d3.event.scale + ")");

}

NodeLink.prototype.init = function() {
	this.force = d3.layout.force()
		.gravity(0.5)
    	.charge(-200)
   		.linkDistance(50)
   		.size([nodelink.w, nodelink.h]);

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

	this.loading = this.svg.append("text")
    .attr("x", nodelink.w / 2)
    .attr("y", nodelink.h / 2)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text("simulating. one moment please…");
}



NodeLink.prototype.loadNetwork = function(graph) {
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

	 var links = nodelink.svg.selectAll("line")
  		.data(graph.links, function(d) { return d.id; });

	links
	   .enter().append("line")
 		.attr("x1", function(d) { return d.source.x; })
  		.attr("y1", function(d) { return d.source.y; })
  		.attr("x2", function(d) { return d.target.x; })
  		.attr("y2", function(d) { return d.target.y; })
		.attr("class", "link")
	    .style("stroke-width", function(d) { return Math.sqrt(d.weight); });

	links
		.exit().remove();

	 var nodes = nodelink.svg.selectAll("circle")
  		.data(graph.nodes, function(d) { return d.id; });

	nodes
	  .enter().append("circle")
  		.attr("cx", function(d) { return d.x; })
  		.attr("cy", function(d) { return d.y; })
  		.attr("r", nodelink.r - .75)
	 	.style("fill", function(d) { return colourscale(d.region); });

	 nodes
		.exit().remove();

	 nodelink.loading.remove();

	}, 10);
}

