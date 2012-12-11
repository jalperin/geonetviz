function Stats() {
	// parameters
	this.margin = {top: 40, right: 10, bottom: 25, left: 60};
	this.width = 750; // width of each chart.
	this.height = 200; // height of each chart.
	this.selector = "#statsview > #stats";

	// public properties
	this.svg = [];
	this.data = null;
    this.vars = null;

    this.has_init = false;
}

Stats.prototype.init = function(num_graphs) {
    this.svg = d3.range(num_graphs);
    d3.range(num_graphs).forEach(function(el, idx, arr) { stats.init_one(idx); })
}

Stats.prototype.init_one = function(idx) {

    var x = d3.scale.ordinal()
        .rangeBands([0, this.width], .2);

    var y = d3.scale.linear()
        .range([this.height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    this.svg[idx] = d3.select(this.selector).append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    x.domain([1, 2, 3, 4, 5])
    y.domain([0, 100])

    this.svg[idx].append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(xAxis);

    this.svg[idx].append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Frequency");

    var height=this.height;
    bars = this.svg[idx].selectAll(".bar").data([1, 2, 3, 4, 5]);

    bars
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return 5; })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return 10; })
        .attr("height", function(d) { return height - 10; });

}

Stats.prototype.loadNetwork = function(network) {
    if (!this.has_init) {
        this.init(network.extra_graphs.length);
        this.has_init = true;
    }

	this.data = network;

    this.data.extra_graphs.forEach(function(el, idx, arr) { stats.load_one(el.data, idx); })
}

Stats.prototype.load_one = function(data, idx) {
    var xdomain = data.map(function(d) { return d.x; });
    var x = d3.scale.ordinal()
        .domain(xdomain)
        .rangeBands([0, this.width], .2);

    var y = d3.scale.linear()
        .range([this.height, 0]);

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

    x.domain(data.map(function(d) { return d.x; }));
    y.domain([0, d3.max(data, function(d) { return d.y; })]);

    this.svg[idx].select(".x.axis").call(xAxis);
    this.svg[idx].select(".y.axis").call(yAxis);

    var height=this.height;
    bars = this.svg[idx].selectAll('.bar').data(data)
    bars
        .enter().append('rect')
        .attr('class', 'bar')

    bars
        .transition().duration(2000).delay(100)
        .attr("x", function(d) { return Math.round(x(d.x)); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.y); })
        .attr("height", function(d) { return height - y(d.y); });

    bars
        .exit()
        .transition().duration(750)
        .style("fill-opacity", 1e-6)
        .remove();

}

