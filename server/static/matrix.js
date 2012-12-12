// This implementation is based on Mike Bostock's co-ocurrence matrix
// http://bost.ocks.org/mike/miserables/

function Matrix() {
	// parameters
	this.margin = {top: 20, right: 10, bottom: 10, left: 20};
	this.width = 800;
	this.height = 800;
	this.selector = "#matrixview > #matrix";

	// public properties
	this.svg = null;
	this.x = null;
	this.z = null;
	this.c = null;
	this.matrix = [];
	this.data = null;
	this.selected_order = 'name';
}



Matrix.prototype.init = function() {
	this.x = d3.scale.ordinal().rangeBands([0, this.width]);
	// FIXME: this requires a maximum to come from the data
	this.c = d3.scale.category10().domain(d3.range(10));

	this.svg = d3.select(this.selector).append("svg")
	    .attr("width", this.width + this.margin.left + this.margin.right)
	    .attr("height", this.height + this.margin.top + this.margin.bottom)
	    .style("margin-left", this.margin.left + "px")
	  .append("g")
	    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
}

Map.prototype.setZScale = function(z_min, z_max) {
	z_max = Math.max(data.map(function(n) { return n.z }));
	z_min = Math.min(data.map(function(n) { return n.z }));
	if ((z_max - z_min ) > 1000) {
		this.z = d3.scale.pow().domain([z_min, z_max]).clamp(true);
	} else {
		this.z = d3.scale.linear().domain([z_min, z_max]).clamp(true);
	}
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
	      .attr("x", function(d) { return matrix.x(d.t); })
	      .attr("width", matrix.x.rangeBand())
	      .attr("height", matrix.x.rangeBand())
	      .style("fill-opacity", function(d) { return matrix.z(d.z); })
		  .style("fill", "bluesteel");

	      // .style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
// 	      .on("mouseover", mouseover)
// 	      .on("mouseout", mouseout);
}

Matrix.prototype.loadNetwork = function(network) {
	// set for easy access by other methods
	this.data = network;

	matrix.order(this.selected_order);

	network.nodes.forEach(function(node) {
		// if you can figure out what this next line is doing, you get a prize!
		matrix.matrix[node.id] = [];
	});

	z_min = 9999999999999999;
	z_max = 0
	// Convert links to matrix; include link weight
	network.links.forEach(function(link) {
		z_min = Math.min(z_min, link.weight);
		z_max = Math.max(z_max, link.weight);
		src_node_id = network.nodes[link.source].id;
		tgt_node_id = network.nodes[link.target].id;
		matrix.matrix[src_node_id].push({s: src_node_id, t: tgt_node_id, z: link.weight});
		matrix.matrix[tgt_node_id].push({s: tgt_node_id, t: src_node_id, z: link.weight});
	});

	this.setZScale(z_min, z_max);

	// FIXME: need to copy over all the properties present in the nodes
	data_to_bind = network.nodes.map(function(node) { return {id: node.id, country_code: node.country_code, region: node.region, links: matrix.matrix[node.id]}; });

	var rowSelection = matrix.svg.selectAll(".row")
		.data(data_to_bind, get_node_id);

	rowSelection
 	  .exit()
		.remove();

	var columnSelection = matrix.svg.selectAll(".column")
		.data(data_to_bind, get_node_id);

	columnSelection
 	  .exit()
		.remove();

	// add in rows that are needed
	// FIXME: this implementation screws up filtering
	// it depends on the node indexes for the position of the cells
	// any deletions will caude indexes to not align with right row
	rowSelection
	  .enter().append("g")
		.attr("class", "row")
		.attr("transform", function(d) { return "translate(0," + matrix.x(d.id) + ")"; })
		.append("text")
			.attr("x", 10)
			.attr("y", matrix.x.rangeBand() / 4)
			.attr("dy", ".01em")
			.attr("text-anchor", "end")
			.attr("fill", function(d) { return colourscale(d.region) })
			.text(function(d) { return d.country_code });

	// remove columns that are not part of the filter
	columnSelection
	  .enter().append("g")
		.attr("class", "column")
		.attr("transform", function(d) { return "translate(" + matrix.x(d.id) + ")rotate(-90)"; })
		.append("text")
			.attr("x", 6)
			.attr("y", matrix.x.rangeBand() / 4)
			.attr("dy", ".01em")
			.attr("text-anchor", "start")
			.attr("fill", function(d) { return colourscale(d.region) })
			.text(function(d) { return d.country_code });


	// add in the cells, for new rows and for existing rows
	rowSelection = matrix.svg.selectAll(".row")
			.each(matrix.row);

	// rowSelection
	//   .enter().append("line")
	// 	.attr("x2", matrix.width);
	//
	// columnSelection
	//   .enter().append("line")
	// 	.attr("x1", -matrix.width);
	//

    // Now move everything to where it goes
    var t = matrix.svg.transition().duration(1000);

    t.selectAll(".row")
        .delay(function(d, i) { return i * 4; })
        .attr("transform", function(d) { return "translate(0," + matrix.x(d.id) + ")"; });

    t.selectAll(".column")
        .delay(function(d, i) { return i * 4; })
        .attr("transform", function(d) { return "translate(" + matrix.x(d.id) + ")rotate(-90)"; });

     t.selectAll(".cell")
        .delay(function(d, i) { return d.s * 4; })
        .attr("x", function(d) { return matrix.x(d.t); })
        .attr("width", matrix.x.rangeBand())
        .attr("height", matrix.x.rangeBand());
}

Matrix.prototype.order = function(order) {
    // Precompute the orders.
	var orders = {
		name: matrix.data.nodes.sort(function(a, b) { return d3.ascending(a.country_code, b.country_code); }).map(get_node_id),
		weight: matrix.data.nodes.sort(function(a, b) { return d3.descending(a.weight, b.weight); }).map(get_node_id),
		region: matrix.data.nodes.sort(function(a, b) { return d3.ascending(a.region, b.region); }).map(get_node_id)
	};

	// set the domain to each node id
	// FIXME: using the keys here is a mistake
	// see comment on row/columnSelection.data() calls above
	matrix.x.domain(orders[order]);

    var t = matrix.svg.transition().duration(1000);

    t.selectAll(".row")
        .delay(function(d, i) { return i * 4; })
        .attr("transform", function(d) { return "translate(0," + matrix.x(d.id) + ")"; });

    t.selectAll(".column")
        .delay(function(d, i) { return i * 4; })
        .attr("transform", function(d) { return "translate(" + matrix.x(d.id) + ")rotate(-90)"; });

     t.selectAll(".cell")
        .delay(function(d, i) { return d.s * 4; })
        .attr("x", function(d) { return matrix.x(d.t); })
        .attr("width", matrix.x.rangeBand())
        .attr("height", matrix.x.rangeBand());
}

function get_node_id(node){
	return node.id;
}

// bind the to the order selector
d3.select("#order").on("change", function() {
	matrix.order(this.value);
	matrix.selected_order = this.value;
});