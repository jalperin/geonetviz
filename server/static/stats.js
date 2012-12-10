function Stats() {
	// parameters
	this.margin = {top: 40, right: 10, bottom: 25, left: 60};
	this.width = 750; // width of each chart.
	this.height = 200; // height of each chart.
	this.selector = "#statsview > #stats";

	// public properties
	this.svg = null;
	this.data = null;
}

Stats.prototype.init = function() {
	/*this.x = d3.scale.ordinal().rangeBands([0, this.width]);
	// FIXME: this requires a maximum to come from the data
	this.z = d3.scale.linear().domain([0, 1000]).clamp(true);
	this.c = d3.scale.category10().domain(d3.range(10));

	this.svg = d3.select(this.selector).append("svg")
	    .attr("width", this.width + this.margin.left + this.margin.right)
	    .attr("height", this.height + this.margin.top + this.margin.bottom)
	    .style("margin-left", this.margin.left + "px")
	  .append("g")
	    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");*/
}

Stats.prototype.loadNetwork = function(network) {
	this.data = network;

    var data = this.data.extra_graphs[0].data;

    var width = this.width;
    var height = this.height;
    var margin = this.margin;

    //var formatPercent = d3.format(".0%");

    var xdomain = data.map(function(d) { return d.x; });
    var x = d3.scale.ordinal()
        .domain(xdomain)
        .rangeBands([0, width], .2);

    var y = d3.scale.linear()
        .range([height, 0]);

    var numticks = Math.round(this.width / 100)
    var maxval = d3.max(data, function(d) { return d.x; })
    var blocksize = Math.round(maxval / numticks)

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickValues(d3.range(0, maxval, blocksize));

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");
        //.tickFormat(formatPercent);

    var svg = d3.select(this.selector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  x.domain(data.map(function(d) { return d.x; }));
  y.domain([0, d3.max(data, function(d) { return d.y; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Frequency");

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return Math.round(x(d.x)); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.y); })
      .attr("height", function(d) { return height - y(d.y); });

}

