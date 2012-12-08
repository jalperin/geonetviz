// This implementation is based on Mike Bostock's co-ocurrence matrix 
// http://bost.ocks.org/mike/miserables/

function NodeLink() {
	// parameters
	this.margin = {top: 20, right: 10, bottom: 10, left: 20};
	this.width = 400;
	this.height = 350;
	this.selector = "#matrixview > #matrix";

	// public properties
	this.svg = null;
	this.x = null;
	this.z = null;
	this.c = null;
	this.matrix = [];
}



NodeLink.prototype.init = function() {
	this.x = d3.scale.ordinal().rangeBands([0, this.width]);
	// FIXME: this requires a maximum to come from the data
	this.z = d3.scale.linear().domain([0, 1000]).clamp(true);
	this.c = d3.scale.category10().domain(d3.range(10));	
	
	this.svg = d3.select(this.selector).append("svg")
	    .attr("width", this.width + this.margin.left + this.margin.right)
	    .attr("height", this.height + this.margin.top + this.margin.bottom)
	    .style("margin-left", this.margin.left + "px")
	  .append("g")
	    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
}

NodeLink.prototype.row = function(row) {
	var cell = d3.select(this).selectAll(".cell")
		.data(row.links);
	
	cell
	  .enter().append("rect");
	
	// cell
	//   .exit().remove();
	
	cell
	      .attr("class", "cell")
	      .attr("x", function(d, i) { return matrix.x(i); })
	      .attr("width", matrix.x.rangeBand())
	      .attr("height", matrix.x.rangeBand())
	      .style("fill-opacity", function(d) { return matrix.z(d.z); })
		  .style("fill", "bluesteel");
		  
	      // .style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
// 	      .on("mouseover", mouseover)
// 	      .on("mouseout", mouseout);
}

NodeLink.prototype.loadNetwork = function() {
	// TODO: build the URL to get_data here	
	d3.json("static/collab2008.json", function(network) {    

		// set the domain to each node id
		matrix.x.domain(d3.keys(network.nodes));
		
		network.nodes.forEach(function(node, i) {
			matrix.matrix[i] = d3.range(network.nodes.length).map(function(j) { return {x: j, y: i, z: 0}; });
		});
			
		// Convert links to matrix; include link weight
		network.links.forEach(function(link) {
			matrix.matrix[link.source][link.target].z += link.weight;
			matrix.matrix[link.target][link.source].z += link.weight;
			// nodes[link.source].count += link.weight;
			// nodes[link.target].count += link.weight;
		});		
		
		// add in rows that are needed
		// NOTE: this implementation does not allow for client-side filtering
		// it depends on the node indexes for the position of the cells
		// any deletions will caude indexes to not align with right row
		var rowSelection = matrix.svg.selectAll(".row")
			.data(network.nodes.map(function(node, i) { return {index: i, id: node.id, links: matrix.matrix[i]}; }))
		  .enter().append("g")
			.attr("class", "row")
			.attr("transform", function(d, i) { return "translate(0," + matrix.x(i) + ")"; })
			.each(matrix.row);

		// remove columns that are not part of the filter
		var columnSelection = matrix.svg.selectAll(".column")
			.data(network.nodes.map(function(node, i) { return {index: i, id: node.id, links: matrix.matrix[i]}; }))
		  .enter().append("g")
			.attr("class", "column")
			.attr("transform", function(d, i) { return "translate(" + matrix.x(i) + ")rotate(-90)"; });
			

		rowSelection.append("line")
			.attr("x2", matrix.width);

		columnSelection.append("line")
			.attr("x1", -matrix.width);			

		rowSelection.append("text")
			.attr("x", 10)
			.attr("y", matrix.x.rangeBand() / 4)
			.attr("dy", ".01em")
			.attr("text-anchor", "end")
			.text(function(d) { return d.id });

		columnSelection.append("text")
			.attr("x", 6)
			.attr("y", matrix.x.rangeBand() / 4)
			.attr("dy", ".01em")
			.attr("text-anchor", "start")
			.text(function(d) { return d.id });
	});          
}

