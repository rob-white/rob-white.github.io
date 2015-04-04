// Inspired by http://informationandvisualization.de/blog/box-plot
// http://bl.ocks.org/mbostock/4061502
// Reusable Box Plot

function BoxPlot() {

    var width = 1,
        height = 1,
        colors = d3.scale.category20(),
        duration = 100,
        domain = null,
        value = Number,
        group = function (d) { return d.group; },
        values = function (d) { return d.values; },
        tooltipParent = "body",
        container = "body",
        tooltip = null,
        margin = { top: 10, right: 5, bottom: 30, left: 30 },
        whiskers = boxWhiskers,
        quartiles = boxQuartiles,
        tickFormat = null;

    // For each small multiple…
    function box(g) {
        g.each(function (d, i) {
            var groupName = group(d);
            d = values(d).map(value).sort(d3.ascending);
            var g = d3.select(this),
                n = d.length,
                min = d[0],
                max = d[n - 1];

            // Compute quartiles. Must return exactly 3 elements.
            var quartileData = d.quartiles = quartiles(d);

            // Compute whiskers. Must return exactly 2 elements, or null.
            var whiskerIndices = whiskers && whiskers.call(this, d, i),
                whiskerData = whiskerIndices && whiskerIndices.map(function (i) { return d[i]; });

            // Compute outliers. If no whiskers are specified, all data are "outliers".
            // We compute the outliers as indices, so that we can join across transitions!
            var outlierIndices = whiskerIndices
                ? d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n))
                : d3.range(n);

            // Compute the new x-scale.
            var x1 = d3.scale.linear()
                .domain(domain && domain.call(this, d, i) || [min, max])
                .range([height, 0]);

            // Retrieve the old x-scale, if this is an update.
            var x0 = this.__chart__ || d3.scale.linear()
                    .domain([0, Infinity])
                    .range(x1.range());

            // Stash the new scale.
            this.__chart__ = x1;

            // calculate most of the coordinates for tooltipping just once:
            var root = d3.select(tooltipParent); // WARNING: only works when the first SVG in the page is us!
            var scr = { x: window.scrollX, y: window.scrollY, w: window.innerWidth, h: window.innerHeight };
            // it's jolly rotten but <body> width/height can be smaller than the SVG it's carrying inside! :-((
            var body_sel = d3.select('body');
            // this is browser-dependent, but screw that for now!
            var body = { w: body_sel.node().offsetWidth, h: body_sel.node().offsetHeight };
            var doc = { w: document.width, h: document.height };
            var svgpos = getNodePos(root.node());
            var dist = { x: 10, y: 60 };

            // Create a tooltip that we can use for hovering in all graphs in this tab
            if (d3.select(container).selectAll('.tooltip').empty()) {
                tooltip = d3.select(container).append('div')
                    .attr('class', 'tooltip right')
                    .style('opacity', 0);
                tooltip.append('div').attr('class', 'tooltip-arrow');
                tooltip.append('div').attr('class', 'tooltip-inner');
            }
            else {
                tooltip = d3.select(container).select('.tooltip');
            }

            g.on("mouseover", function (d, i) {
                var tooltip = d3.select(container).select('.tooltip');
                tooltip.select('.tooltip-inner').style('background-color', colors(groupName));
                tooltip.style("opacity", "1").style("display", "block").style('filter', 'alpha(opacity=100)').select('.tooltip-inner').html(groupName);
                var m = d3.mouse(root.node());
                scr.x = window.scrollX;
                scr.y = window.scrollY;

                m[1] += svgpos.y;
                tooltip.style("right", "");
                tooltip.style("left", "");
                tooltip.style("bottom", "");
                tooltip.style("top", "");

                if (m[0] >= window.innerWidth / 2) {
                    tooltip.select('.tooltip-arrow').style('border-left-color', colors(groupName));
                    tooltip.attr("class", "tooltip left").style("left", (m[0] - tooltip.node().scrollWidth - dist.x) + "px");
                }
                else {
                    tooltip.select('.tooltip-arrow').style('border-right-color', colors(groupName));
                    tooltip.attr("class", "tooltip right").style("left", (m[0] + dist.x) + "px");
                }
                tooltip.style("top", (m[1] + root.node().scrollTop - tooltip.node().scrollHeight / 2) + "px");
            })
                .on("mouseout", function (d, i) {
                    tooltip.style("opacity", "0").style("display", "none").style('filter', 'alpha(opacity=0)');
                });


            // Note: the box, median, and box tick elements are fixed in number,
            // so we only have to handle enter and update. In contrast, the outliers
            // and other elements are variable, so we need to exit them! Variable
            // elements also fade in and out.

            // Update center line: the vertical line spanning the whiskers.
            var center = g.selectAll("line.center")
                .data(whiskerData ? [whiskerData] : []);

            center.enter().insert("line", "rect")
                .attr("class", "center")
                .attr("x1", width / 2)
                .attr("y1", function (d) { return x0(d[0]); })
                .attr("x2", width / 2)
                .attr("y2", function (d) { return x0(d[1]); })
                .style("opacity", 1e-6)
                .transition()
                .duration(duration)
                .style("opacity", 1)
                .attr("y1", function (d) { return x1(d[0]); })
                .attr("y2", function (d) { return x1(d[1]); });

            center.transition()
                .duration(duration)
                .style("opacity", 1)
                .attr("y1", function (d) { return x1(d[0]); })
                .attr("y2", function (d) { return x1(d[1]); });

            center.exit().transition()
                .duration(duration)
                .style("opacity", 1e-6)
                .attr("y1", function (d) { return x1(d[0]); })
                .attr("y2", function (d) { return x1(d[1]); })
                .remove();

            // Update innerquartile box.
            var boxRect = g.selectAll("rect.box")
                .data([quartileData]);

            boxRect.enter().append("rect")
                .attr("class", "box")
                .attr("x", 0)
                .attr("y", function (d) { return x0(d[2]); })
                .style('stroke', colors(groupName))
                .attr("width", width)
                .attr("height", function (d) { return x0(d[0]) - x0(d[2]); })
                .transition()
                .duration(duration)
                .attr("y", function (d) { return x1(d[2]); })
                .attr("height", function (d) { return x1(d[0]) - x1(d[2]); });

            boxRect.transition()
                .duration(duration)
                .attr("y", function (d) { return x1(d[2]); })
                .attr("height", function (d) { return x1(d[0]) - x1(d[2]); });

            // Update median line.
            var medianLine = g.selectAll("line.median")
                .data([quartileData[1]]);

            medianLine.enter().append("line")
                .attr("class", "median")
                .attr("x1", 0)
                .attr("y1", x0)
                .attr("x2", width)
                .attr("y2", x0)
                .transition()
                .duration(duration)
                .attr("y1", x1)
                .attr("y2", x1);

            medianLine.transition()
                .duration(duration)
                .attr("y1", x1)
                .attr("y2", x1);

            // Update whiskers.
            var whisker = g.selectAll("line.whisker")
                .data(whiskerData || []);

            whisker.enter().insert("line", "circle, text")
                .attr("class", "whisker")
                .attr("x1", 0)
                .attr("y1", x0)
                .attr("x2", width)
                .attr("y2", x0)
                .style("opacity", 1e-6)
                .transition()
                .duration(duration)
                .attr("y1", x1)
                .attr("y2", x1)
                .style("opacity", 1);

            whisker.transition()
                .duration(duration)
                .attr("y1", x1)
                .attr("y2", x1)
                .style("opacity", 1);

            whisker.exit().transition()
                .duration(duration)
                .attr("y1", x1)
                .attr("y2", x1)
                .style("opacity", 1e-6)
                .remove();

            // Update outliers.
            var outlier = g.selectAll("circle.outlier")
                .data(outlierIndices, Number);

            outlier.enter().insert("circle", "text")
                .attr("class", "outlier")
                .attr("r", 3.5)
                .attr("cx", width / 2)
                .attr("cy", function (i) { return x0(d[i]); })
                .style("opacity", 1e-6)
                .transition()
                .duration(duration)
                .attr("cy", function (i) { return x1(d[i]); })
                .style("opacity", 1);

            outlier.transition()
                .duration(duration)
                .attr("cy", function (i) { return x1(d[i]); })
                .style("opacity", 1);

            outlier.exit().transition()
                .duration(duration)
                .attr("cy", function (i) { return x1(d[i]); })
                .style("opacity", 1e-6)
                .remove();

            // Compute the tick format.
            var format = tickFormat || x1.tickFormat(d3.format("s"));

            // Update box ticks.
            var boxTick = g.selectAll("text.box")
                .data(quartileData);

            boxTick.enter().append("text")
                .attr("class", "box")
                .attr("dy", ".3em")
                .attr("dx", function (d, i) { return i & 1 ? 6 : -6 })
                .attr("x", function (d, i) { return i & 1 ? width : 0 })
                .attr("y", x0)
                .attr("text-anchor", function (d, i) { return i & 1 ? "start" : "end"; })
                .text(format)
                .transition()
                .duration(duration)
                .attr("y", x1);

            boxTick.transition()
                .duration(duration)
                .text(format)
                .attr("y", x1);

            // Update whisker ticks. These are handled separately from the box
            // ticks because they may or may not exist, and we want don't want
            // to join box ticks pre-transition with whisker ticks post-.
            var whiskerTick = g.selectAll("text.whisker")
                .data(whiskerData || []);

            whiskerTick.enter().append("text")
                .attr("class", "whisker")
                .attr("dy", ".3em")
                .attr("dx", 6)
                .attr("x", width)
                .attr("y", x0)
                .text(format)
                .style("opacity", 1e-6)
                .transition()
                .duration(duration)
                .attr("y", x1)
                .style("opacity", 1);

            whiskerTick.transition()
                .duration(duration)
                .text(format)
                .attr("y", x1)
                .style("opacity", 1);

            whiskerTick.exit().transition()
                .duration(duration)
                .attr("y", x1)
                .style("opacity", 1e-6)
                .remove();
        });

        d3.timer.flush();
    }

    box.width = function (x) {
        if (!arguments.length) return width;
        width = x;
        return box;
    };

    box.height = function (x) {
        if (!arguments.length) return height;
        height = x;
        return box;
    };

    box.margin = function (x) {
        if (!arguments.length) return margin;
        margin = x;
        return box;
    };

    box.tickFormat = function (x) {
        if (!arguments.length) return tickFormat;
        tickFormat = x;
        return box;
    };

    box.duration = function (x) {
        if (!arguments.length) return duration;
        duration = x;
        return box;
    };

    box.domain = function (x) {
        if (!arguments.length) return domain;
        domain = x == null ? x : d3.functor(x);
        return box;
    };

    box.value = function (x) {
        if (!arguments.length) return value;
        value = x;
        return box;
    };

    box.container = function (x) {
        if (!arguments.length) return container;
        container = x;
        return box;
    };

    box.tooltipParent = function (x) {
        if (!arguments.length) return tooltipParent;
        tooltipParent = x;
        return box;
    };

    box.whiskers = function (x) {
        if (!arguments.length) return whiskers;
        whiskers = x;
        return box;
    };

    box.quartiles = function (x) {
        if (!arguments.length) return quartiles;
        quartiles = x;
        return box;
    };

    box.group = function (x) {
        if (!arguments.length) return group;
        group = x;
        return box;
    };

    box.values = function (x) {
        if (!arguments.length) return values;
        values = x;
        return box;
    };

    box.colors = function (x) {
        if (!arguments.length) return colors;
        colors = x;
        return box;
    };

    function boxWhiskers(d) {
        return [0, d.length - 1];
    }

    function boxQuartiles(d) {
        return [
            d3.quantile(d, .25),
            d3.quantile(d, .5),
            d3.quantile(d, .75)
        ];
    }

    // http://stackoverflow.com/questions/288699/get-the-position-of-a-div-span-tag
    // dirty hack/fixes for FireFox (code barfed on FF with NaN/NaN)
    function getNodePos(el) {
        var body = d3.select('body').node();
        for (var lx = 0,
                 ly = 0;
             el != null && el != body;
             lx += (el.offsetLeft || el.clientLeft),
                 ly += (el.offsetTop || el.clientTop),
                 el = (el.offsetParent || el.parentNode));
        return { x: lx, y: ly };
    }

    return box;
}