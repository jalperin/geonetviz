// This implementation is based on Mike Bostock's co-ocurrence matrix
// http://bost.ocks.org/mike/miserables/

function Matrix() {
	// parameters
	this.margin = {top: 20, right: 10, bottom: 10, left: 20};
	this.width = 1000;
	this.height = 1000;
	this.selector = "#matrixview > #matrix";

	// public properties
	this.svg = null;
	this.x = null;
	this.z = null;
	this.c = null;
	this.matrix = [];
	this.data = null;
}



Matrix.prototype.init = function() {
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

Matrix.prototype.row = function(row) {
	// FIXME: this is still using the global Matrix instance
	// .each has the row as "this", so how to access the matrix object instance?
	var cell = d3.select(this).selectAll(".cell")
		.data(row.links);

	cell
	  .enter().append("rect");

	cell
	  .exit().remove();

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

Matrix.prototype.loadNetwork = function(network) {
	this.data = network;

	// order (also sets the domain)
	matrix.order('name');

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

	var rowSelection = matrix.svg.selectAll(".row")
		.data(network.nodes.map(function(node, i) { return {index: i, id: node.country_code, links: matrix.matrix[i]}; }))
 	  .exit()
		.remove();

	var columnSelection = matrix.svg.selectAll(".column")
		.data(network.nodes.map(function(node, i) { return {index: i, id: node.country_code, links: matrix.matrix[i]}; }))
 	  .exit()
		.remove();

	// add in rows that are needed
	// FIXME: this implementation screws up filtering
	// it depends on the node indexes for the position of the cells
	// any deletions will caude indexes to not align with right row
	rowSelection = matrix.svg.selectAll(".row")
		.data(network.nodes.map(function(node, i) { return {index: i, id: node.country_code, region: node.region, links: matrix.matrix[i]}; }))
	  .enter().append("g")
		.attr("class", "row")
		.attr("transform", function(d, i) { return "translate(0," + matrix.x(i) + ")"; });

	// remove columns that are not part of the filter
	columnSelection = matrix.svg.selectAll(".column")
		.data(network.nodes.map(function(node, i) { return {index: i, id: node.country_code, region: node.region, links: matrix.matrix[i]}; }))
	  .enter().append("g")
		.attr("class", "column")
		.attr("transform", function(d, i) { return "translate(" + matrix.x(i) + ")rotate(-90)"; });

	// add in the cells, for new rows and for existing rows
	rowSelection = matrix.svg.selectAll(".row")
			.each(matrix.row);

	rowSelection.append("line")
		.attr("x2", matrix.width);

	columnSelection.append("line")
		.attr("x1", -matrix.width);

	rowSelection.append("text")
		.attr("x", 10)
		.attr("y", matrix.x.rangeBand() / 4)
		.attr("dy", ".01em")
		.attr("text-anchor", "end")
		.attr("fill", function(d) { return colourscale(d.region) })
		.text(function(d) { return d.id });

	columnSelection.append("text")
		.attr("x", 6)
		.attr("y", matrix.x.rangeBand() / 4)
		.attr("dy", ".01em")
		.attr("text-anchor", "start")
		.attr("fill", function(d) { return colourscale(d.region) })
		.text(function(d) { return d.id });

    // Now move everything to where it goes
    var t = matrix.svg.transition().duration(2500);

    t.selectAll(".row")
        .delay(function(d, i) { return i * 4; })
        .attr("transform", function(d, i) { return "translate(0," + matrix.x(d.index) + ")"; });

    t.selectAll(".column")
        .delay(function(d, i) { return i * 4; })
        .attr("transform", function(d, i) { return "translate(" + matrix.x(d.index) + ")rotate(-90)"; });

     t.selectAll(".cell")
        .delay(function(d, i) { return d.y * 4; })
        .attr("x", function(d) { return matrix.x(d.x); })
        .attr("width", matrix.x.rangeBand())
        .attr("height", matrix.x.rangeBand());
}

Matrix.prototype.order = function(order) {
    // Precompute the orders.
	var orders = {
		name: matrix.data.nodes.sort(function(a, b) { return d3.ascending(a.country_code, b.country_code); }),
		weight: matrix.data.nodes.sort(function(a, b) { return d3.ascending(a.weight, b.weight); }),
		region: matrix.data.nodes.sort(function(a, b) { return d3.ascending(a.region, b.region); })
	};

	// set the domain to each node id
	// FIXME: using the keys here is a mistake
	// see comment on row/columnSelection.data() calls above
	matrix.x.domain(d3.keys(orders[order]));
}

// bind the to the order selector
d3.select("#order").on("change", function() {
	matrix.order(this.value);
});