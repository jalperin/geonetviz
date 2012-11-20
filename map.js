var width = 960,
    height = 500,
    centered;

var projection = d3.geo.mercator()
    .scale(width)
    .translate([0, 0]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", click);

var g = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

var country_group = g.append("g")
    .attr("id", "countries");

var arc_group = g.append("g")
    .attr("id", "arcs");

function loadNetwork() {
	d3.json("collab2008.json", function(network) {    
            arc_group.selectAll("path")
            .data(network.links)
            .enter().append("path")
            .attr("d", function(d) {
                  var source_country = country_group.selectAll('[country_code=' + network.nodes[d.source].id + ']').datum();
                  var target_country = country_group.selectAll('[country_code=' + network.nodes[d.target].id + ']').datum();
                  return path({
                              type: "LineString",
                              coordinates: [path.centroid(source_country), path.centroid(target_country)]
                              });
                  })
            ;    
            });            
}

d3.json("world-countries.json", function(countries) {
	// TODO: build the URL to get_data here
        
    country_group.selectAll("path")
      .data(countries.features)
    .enter().append("path")
      .attr("d", path)
      .attr("country_code", function(d) { return d.id; })
      .on("click", click);                      

//    FIX path for LineString. Then uncomment this line. See: http://stackoverflow.com/questions/13468609/why-is-d3-geo-path-giving-nan
    loadNetwork();
});


function click(d) {
  var x = 0,
      y = 0,
      k = 1;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = -centroid[0];
    y = -centroid[1];
    k = 4;
    centered = d;
  } else {
    centered = null;
  }

  country_group.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  country_group.transition()
      .duration(1000)
      .attr("transform", "scale(" + k + ")translate(" + x + "," + y + ")")
      .style("stroke-width", 1.5 / k + "px");
}