// This implementation is based on Mike Bostock's co-ocurrence matrix 
// http://bost.ocks.org/mike/miserables/

function NodeLink() {
	// parameters
	this.margin = {top: 20, right: 10, bottom: 10, left: 20};
	this.w = 800;
	this.h = 400;
	this.r = 6;
	this.n = 100;
	this.selector = "#nodelinkview > #nodelink";

	// public properties
	this.svg = null;
	this.color = null;
	this.force = null;
}


NodeLink.prototype.init = function() {
	
	this.color = d3.scale.category20();

	this.force = d3.layout.force()
		.gravity(0.5)
    	.charge(-200)
   		.linkDistance(50)
   		.size([nodelink.w, nodelink.h]);

	this.svg = d3.select(this.selector).append("svg")
    	.attr("width", nodelink.w)
    	.attr("height", nodelink.h);

	this.loading = this.svg.append("text")
    .attr("x", nodelink.w / 2)
    .attr("y", nodelink.h / 2)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text("simulating. one moment please…");
}

NodeLink.prototype.loadNetwork = function() {

	d3.json("/static/collab2008.json", function(graph) {

		 setTimeout(function() {
	 						  
		 nodelink.force
		     .nodes(graph.nodes)
			 .links(graph.links)
			 .start();

		 for (var i = nodelink.n * nodelink.n; i > 0; --i) nodelink.force.tick();
		 nodelink.force.stop();

		 nodelink.svg.selectAll("line")
      		.data(graph.links)
   		 	.enter().append("line")
     		.attr("x1", function(d) { return d.source.x; })
      		.attr("y1", function(d) { return d.source.y; })
      		.attr("x2", function(d) { return d.target.x; })
      		.attr("y2", function(d) { return d.target.y; })
			.attr("class", "link")
		    .style("stroke-width", function(d) { return Math.sqrt(d.value); });

 		 nodelink.svg.selectAll("circle")
      		.data(graph.nodes)
    		.enter().append("circle")
      		.attr("cx", function(d) { return d.x; })
      		.attr("cy", function(d) { return d.y; })
      		.attr("r", nodelink.r - .75)
		 	.style("fill", function(d) { return nodelink.color(d.group); });

		 nodelink.loading.remove();

		}, 10);

	});	

}

