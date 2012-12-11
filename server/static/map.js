
function Map() {
	// parameters
	this.width = 1000;
	this.height = 1000;
	this.selector = "#mapview > #map";

	// public properties
	this.centered = null;
	this.projection = null;
	this.path = null;
	this.svg = null;
	this.g = null;
	this.country_group = null;
	this.arc_group = null;

	// the network
	this.network = null;
}

Map.prototype.init = function() {
	this.projection = d3.geo.mercator()
	    .scale(this.width)
	    .translate([0, 0]);

	this.path = d3.geo.path()
	    .projection(this.projection);

	this.zoom = d3.behavior.zoom()
	    .translate(this.projection.translate())
	    .scale(this.projection.scale())
	    .scaleExtent([this.height, 8 * this.height])
	    .on("zoom", this.zoommove);

	this.svg = d3.select(this.selector).append("svg")
	    .attr("width", this.width)
	    .attr("height", this.height);

	this.svg.append("rect")
	    .attr("class", "background")
	    .attr("width", this.width)
	    .attr("height", this.height)
	    .on("click", this.click);

	this.g = this.svg.append("g")
	    .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");

	this.country_group = this.g.append("g")
	    .attr("id", "countries")
		.call(this.zoom);

	this.arc_group = this.g.append("g")
	    .attr("id", "arcs");

	// load the base map
	d3.json("/static/world-countries.json", function(countries) {
	    map.country_group.selectAll("path")
	      .data(countries.features)
	    .enter().append("path")
	      .attr("d", map.path)
	      .attr("country_code", function(d) { return d.id; })
	      .on("mouseover", map.mouseover);
	});
}

Map.prototype.loadNetwork = function(network) {
	// colour the basemap
	for (var i=0; i < network.nodes.length; i++) {
		map.country_group.selectAll("path[country_code=" + network.nodes[i].country_code + "]")
			.attr("fill", colourscale(network.nodes[i].region));
	}

	map.data = network;
	var arcs = map.arc_group.selectAll("path")
		.data(network.links);

	arcs
	  .enter().append("path")
	    .attr("class", "arc")
		.attr("d", map.arcpath);

	arcs
	  .exit()
	    .remove();

	map.arc_group.selectAll("path")
	// FIXME: this should be set from the CSS
		.attr("opacity", .4)
		.attr("d", map.arcpath);
}

Map.prototype.arcpath = function(d) {
	var tmp_src = map.country_group.selectAll('[country_code=' + map.data.nodes[d.source].country_code + ']');
	var tmp_tgt = map.country_group.selectAll('[country_code=' + map.data.nodes[d.target].country_code + ']');

	if (tmp_src[0].length && tmp_tgt[0].length ) {
		var source_country = tmp_src.datum();
		var target_country = tmp_tgt.datum();
		var line = d3.svg.line();
		return line([map.path.centroid(source_country), map.path.centroid(target_country)]);
	}
}


Map.prototype.zoommove = function () {
	// FIXME: how to get reference to map instance in a non-global way?
    map.projection.translate(d3.event.translate).scale(d3.event.scale);
    map.country_group.selectAll("path").attr("d", map.path);
	map.arc_group.selectAll("path").attr("d", map.arcpath);
}

Map.prototype.mouseover = function (p) {
	// FIXME: this not elevant at all
	node = null;
	for (var i=0; i < map.data.nodes.length; i++) {
		if (map.data.nodes[i].country_code == p.id) {
			node = map.data.nodes[i];
			break;
		}
	}

	content = '<p>' + node.country_name + ', ' + node.region + '</span></p>';
	content += '<hr class="tooltip-hr">';
    content += '<p>' + node.degree + ' links' + '; ' + Math.round(node.average_neighbor_degree) + ' avg neighbor links' + '</span></p>';
	nodelink.tooltip.showTooltip(content,d3.event);
// FIXME: bet it has to do with the fact that we are using nodelink.tooltip here rather than a map.tooltip

	map.arc_group.selectAll("path")
		.attr("opacity",
			function(d) {
				if  (map.data.nodes[d.source].country_code == p.id || map.data.nodes[d.target].country_code == p.id) {
					return 1;
				} else {
					return .4;
				}
			})
		.style("stroke",
			function(d) {
				if  (map.data.nodes[d.source].country_code == p.id || map.data.nodes[d.target].country_code == p.id) {
					return '#555';
				} else {
					return '#ddd';
				}
			}) ;

  }


Map.prototype.mouseout = function (p) {
	// FIXME: this not elevant at all

	nodelink.tooltip.hideTooltip();

	map.arc_group.selectAll("path")
		.attr("opacity", 0.8)
		.style("stroke", '#555');
;

  }
