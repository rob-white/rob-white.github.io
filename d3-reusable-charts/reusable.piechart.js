// Rob White 2015
// Reusable Pie Chart

function PieChart() {

    var width = 300,
        height = 300,
        margin = { top: 20, right: 20, bottom: 20, left: 20 },
        group = function (d, i) { return d[0]; },
        value = function (d, i) { return d[1]; },
        outerRadius = Math.min(width, height) / 2,
        innerRadius = 0,
        color = d3.scale.category20(),
        root = d3.select("body"),
        scr = { x: window.scrollX, y: window.scrollY, w: window.innerWidth, h: window.innerHeight },
        body_sel = d3.select("body"),
        body = { w: body_sel.node().offsetWidth, h: body_sel.node().offsetHeight },
        doc = { w: document.width, h: document.height },
        svgpos = getNodePos(root.node()),
        dist = { x: 10, y: 60 };

    function chart(selection) {

        selection.each(function (data) {

            var sel = this;
            var groupValues = data.map(function (d, i) { return group.call(data, d, i); })
            var uniqueValues = groupValues.filter( function(value, index, self){
                return self.indexOf(value) === index;
            });

            color.domain(uniqueValues);

            var arc = d3.svg.arc()
                .outerRadius(outerRadius)
                .innerRadius(outerRadius - innerRadius > 0 ? innerRadius : 0);

            var pie = d3.layout.pie()
                .sort(null)
                .value(function (d, i) { return value.call(data, d, i); });

            // Append if there isn't a container for this pie yet
            var svg = d3.select(this).select("svg > g");
            if (svg.empty()) {
                // Create a tooltip that we can use for hovering in all graphs in this tab
                var tooltip = d3.select(this).append('div')
                    .attr('class', 'tooltip right')
                    .style('display', 'none');
                tooltip.append('div').attr('class', 'tooltip-arrow');
                tooltip.append('div').attr('class', 'tooltip-inner');

                svg = d3.select(this).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                .append("g")
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
            }
            else {
                svg = d3.select(this).select("svg")
                    .attr("width", width)
                    .attr("height", height)
                .select("g")
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
            }

            // Find all elements and apply new data
            var g = svg.selectAll(".arc")
                .data(function (d, i) { return pie(data); });

            // Update existing
            g.select("path")
                .style("fill", function (d, i) { return color(group.call(d, d.data, i)); })
            .transition()
                .attrTween("d", arcTween);

            // Add new
            var eG = g.enter().append("g")
                .attr("class", "arc");

            eG.append("path").attr("d", arc)
                .on("mouseover", function (d, i) {
                    var selectedRect = d3.select(this);
                    var tooltipHTML = '';
                    tooltipHTML += 'Group: ' + group.call(d, d.data, i) + '<br />Value: ' + value.call(d, d.data, i);

                    var tooltip = d3.select(sel).select('.tooltip');
                    tooltip.select('.tooltip-inner').style('background-color', selectedRect.style('fill') == "rgb(255, 255, 255)" ? selectedRect.style('stroke') : d3.rgb(selectedRect.style('fill')).darker());
                    tooltip.style("opacity", "1").style("display", "block").style('filter', 'alpha(opacity=100)').select('.tooltip-inner').html(tooltipHTML);

                    var m = d3.mouse(root.node());
                    scr.x = window.scrollX;
                    scr.y = window.scrollY;

                    svgpos = getNodePos(root.node());

                    m[1] += svgpos.y;
                    tooltip.style("right", "");
                    tooltip.style("left", "");
                    tooltip.style("bottom", "");
                    tooltip.style("top", "");

                    if (m[0] >= window.innerWidth / 2) {
                        tooltip.select('.tooltip-arrow').style('border-left-color', selectedRect.style('fill') == "rgb(255, 255, 255)" ? selectedRect.style('stroke') : d3.rgb(selectedRect.style('fill')).darker());
                        tooltip.attr("class", "tooltip left").style("left", (m[0] - tooltip.node().scrollWidth - dist.x) + "px");
                    }
                    else {
                        tooltip.select('.tooltip-arrow').style('border-right-color', selectedRect.style('fill') == "rgb(255, 255, 255)" ? selectedRect.style('stroke') : d3.rgb(selectedRect.style('fill')).darker());
                        tooltip.attr("class", "tooltip right").style("left", (m[0] + dist.x) + "px");
                    }
                    tooltip.style("top", (m[1] + root.node().scrollTop - tooltip.node().scrollHeight / 2) + "px");
                })
                .on("mousemove", function (d, i) {
                    var selectedRect = d3.select(this);
                    var tooltip = d3.select(sel).select('.tooltip');

                    var m = d3.mouse(root.node());
                    scr.x = window.scrollX;
                    scr.y = window.scrollY;

                    svgpos = getNodePos(root.node());

                    m[1] += svgpos.y;
                    tooltip.style("right", "");
                    tooltip.style("left", "");
                    tooltip.style("bottom", "");
                    tooltip.style("top", "");

                    if (m[0] >= window.innerWidth / 2) {
                        tooltip.select('.tooltip-arrow').style('border-left-color', selectedRect.style('fill') == "rgb(255, 255, 255)" ? selectedRect.style('stroke') : d3.rgb(selectedRect.style('fill')).darker());
                        tooltip.attr("class", "tooltip left").style("left", (m[0] - tooltip.node().scrollWidth - dist.x) + "px");
                    }
                    else {
                        tooltip.select('.tooltip-arrow').style('border-right-color', selectedRect.style('fill') == "rgb(255, 255, 255)" ? selectedRect.style('stroke') : d3.rgb(selectedRect.style('fill')).darker());
                        tooltip.attr("class", "tooltip right").style("left", (m[0] + dist.x) + "px");
                    }
                    tooltip.style("top", (m[1] + root.node().scrollTop - tooltip.node().scrollHeight / 2) + "px");

                    var selectedRect = d3.select(this);
                    var tooltip = d3.select(sel).select('.tooltip');

                    var m = d3.mouse(root.node());
                    scr.x = window.scrollX;
                    scr.y = window.scrollY;
                })
                .on("mouseout", function (d, i) {
                    var selectedRect = d3.select(this);
                    tooltip.style("opacity", "0").style("display", "none").style('filter', 'alpha(opacity=0)');
                })
                .style("fill", function (d, i) { return color(group.call(d, d.data, i)); })
                .each(function (d, i) { this._current = d; });

            // Remove remaining without data
            g.exit().remove();

            function arcTween(d) {
                var i = d3.interpolate(this._current, d);
                this._current = i(0);
                return function (t) {
                    return arc(i(t));
                };
            }

        });
    }

    chart.value = function (_) {
        if (!arguments.length) return value;
        value = _;

        return chart;
    };

    chart.group = function (_) {
        if (!arguments.length) return group;
        group = _;

        return chart;
    };

    chart.width = function (_) {
        if (!arguments.length) return width;
        width = _;

        return chart;
    };

    chart.height = function (_) {
        if (!arguments.length) return height;
        height = _;

        return chart;
    };

    chart.radius = function (_) {
        if (!arguments.length) return outerRadius;
        outerRadius = _;

        return chart;
    };

    chart.innerRadius = function (_) {
        if (!arguments.length) return innerRadius;
        innerRadius = _;

        return chart;
    };

    chart.rootNode = function (_) {
        if (!arguments.length) return root;
        root = _;

        return chart;
    };

    chart.color = function (_) {
        if (!arguments.length) return color;
        color = _;

        return chart;
    };

    /**
     * @desc http://stackoverflow.com/questions/288699/get-the-position-of-a-div-span-tag - dirty hack/fixes for FireFox (code barfed on FF with NaN/NaN)
     * @return object - Current position of data point mouse is hovering over in format { x: lx, y: ly }
     */
    function getNodePos(el) {
        var body = d3.select('body').node();

        for (var lx = 0, ly = 0;
             el != null && el != body;
             lx += (el.offsetLeft || el.clientLeft), ly += (el.offsetTop || el.clientTop), el = (el.offsetParent || el.parentNode))
            ;
        return { x: lx, y: ly };
    }

    return chart;
}