// This implementation is based on Mike Bostock's co-ocurrence matrix 
// http://bost.ocks.org/mike/miserables/

function NodeLink() {
	// parameters
	this.margin = {top: 20, right: 10, bottom: 10, left: 20};
	this.width = 960;
	this.height = 500;
	this.selector = "#nodelinkview > #nodelink";

	// public properties
	this.svg = null;
	this.c = null;
	this.force = null;
}


NodeLink.prototype.init = function() {
	
	this.c = d3.scale.category20();

	this.force = d3.layout.force()
    	.charge(-120)
   		.linkDistance(30)
   		.size([nodelink.width, nodelink.height]);

	this.svg = d3.select("body").append("svg")
    	.attr("width", nodelink.width)
    	.attr("height", nodelink.height);
}

NodeLink.prototype.loadNetwork = function() {

		d3.json("/static/miserables.json", function(error, graph) {
		  force
			  .nodes(graph.nodes)
			  .links(graph.links)
			  .start();

		  var link = svg.selectAll("line.link")
			  .data(graph.links)
			.enter().append("line")
			  .attr("class", "link")
			  .style("stroke-width", function(d) { return Math.sqrt(d.value); });

		  var node = svg.selectAll("circle.node")
			  .data(graph.nodes)
			.enter().append("circle")
			  .attr("class", "node")
			  .attr("r", 5)
			  .style("fill", function(d) { return color(d.group); })
			  .call(force.drag);

		  node.append("title")
			  .text(function(d) { return d.name; });

		  force.on("tick", function() {
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
		  });
		});	
}

