
function Map() {
	// parameters
	this.width = 1000;
	this.height = 1000;
	this.selector = "#mapview > #map";

	// public properties
	this.centered = null;
	this.projection = null;
	this.path = null;
	this.greatArc = null;
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

	this.greatArc = d3.geo.greatArc().precision(1);
	this.greatArc.source(function(link) { return [map.data.nodes[link.source].lng, map.data.nodes[link.source].lat]})
	this.greatArc.target(function(link) { return [map.data.nodes[link.target].lng, map.data.nodes[link.target].lat]})

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
	return splitPath(map.path(map.greatArc(d)));
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
					return .6;
				}
			})
		.style("stroke",
			function(d) {
				if  (map.data.nodes[d.source].country_code == p.id || map.data.nodes[d.target].country_code == p.id) {
					return '##999';
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
}

function splitPath(path) {
  var avgd = 0, i, d;
  var c, pc, dx, dy;
  var points = path.split("L");
  if (points.length < 2) return path;
  var newpath = [ points[0] ];
  var coords = points.map(function(d, i) {
    return d.substr(i > 0 ? 0 : 1).split(","); // remove M and split
  });

  // calc avg dist between points
  for (i = 1; i < coords.length; i++) {
    pc = coords[i-1]; c = coords[i];
    dx = c[0] - pc[0]; dy = c[1] - pc[1];
    d = Math.sqrt(dx*dx + dy*dy);
    c.push(d);  // push dist as last elem of c
    avgd += d;
  }
  avgd /= coords.length - 1;

  // for points with long dist from prev use M instead of L
  for (i = 1; i < coords.length; i++) {
    c = coords[i];
    newpath.push((c[2] > 5 * avgd ? "M" : "L") + points[i]);
  }
  return newpath.join();
}
