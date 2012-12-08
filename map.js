function Map() {
	// parameters
	this.width = 400;
	this.height = 350;
	this.selector = "#mapview > #map";

	// public properties
	this.centered = null;
	this.projection = null;
	this.path = null;
	this.svg = null;
	this.g = null;
	this.country_group = null;
	this.arc_group = null;
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
	    .attr("id", "arcs")
		.call(this.zoom);

	// load the base map
	d3.json("world-countries.json", function(countries) {
	    map.country_group.selectAll("path")
	      .data(countries.features)
	    .enter().append("path")
	      .attr("d", map.path)
	      .attr("country_code", function(d) { return d.id; })
	      .on("click", map.click);
	});
}

Map.prototype.loadNetwork = function() {
	var themap = this;

	// TODO: build the URL to get_data here
	d3.json("collab2008.json", function(network) {
		// Question: I wanted to use "this.arc_group", but
		// I don't understand JS' "this" keyword. help!
            var arcs = themap.arc_group.selectAll("path")
				.data(network.links);

			arcs
              .enter().append("path")
 			    .attr("class", "arc")
            	.attr("d", function(d) {
					var tmp_src = themap.country_group.selectAll('[country_code=' + network.nodes[d.source].id + ']');
					var tmp_tgt = themap.country_group.selectAll('[country_code=' + network.nodes[d.target].id + ']');

					if (tmp_src[0].length && tmp_tgt[0].length ) {
						var source_country = tmp_src.datum();
						var target_country = tmp_tgt.datum();
						var line = d3.svg.line();
						return line([themap.path.centroid(source_country), themap.path.centroid(target_country)]);
					}
	              });

			arcs
			  .exit()
			    .remove();
	        });
}

Map.prototype.zoommove = function () {
	// FIXME: how to get reference to map instance in a non-global way?
    map.projection.translate(d3.event.translate).scale(d3.event.scale);
    map.country_group.selectAll("path").attr("d", map.path);
	map.arc_group.selectAll("path").attr("d", map.path);
}

Map.prototype.click = function (d) {
	var x = 0,
	  y = 0,
	  k = 1;

	  // same this vs map question here
	if (d && map.centered !== d) {
	var centroid = map.path.centroid(d);
	x = -centroid[0];
	y = -centroid[1];
	k = 4;
	map.centered = d;
	} else {
	map.centered = null;
	}

	map.country_group.selectAll("path")
	  .classed("active", map.centered && function(d) { return d === map.centered; });

	map.country_group.transition()
	  .duration(1000)
	  .attr("transform", "scale(" + k + ")translate(" + x + "," + y + ")")
	  .style("stroke-width", 1.5 / k + "px");
}