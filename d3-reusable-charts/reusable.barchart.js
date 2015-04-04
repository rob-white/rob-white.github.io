// Rob White 2015
// Reusable Bar Chart

function BarChart() {

    var margin = { top: 20, right: 20, bottom: 40, left: 30 },
        width = 400,
        height = 200,
        type = "stacked",
        color = d3.scale.category10(), // Default bar colors
        domain = null,
        xValue = function (d) { return d[0]; },
        yValue = function (d) { return d[1]; },
        xScale = d3.scale.ordinal(),
        x1Scale = d3.scale.ordinal(),
        yScale = d3.scale.linear(),
        xTickFormat = function (d) { return d },
        yTickFormat = d3.format("s"),
        xLabel = "", // Default x-axis text label
        yLabel = "", // Default y-axis text label
        labelFormat = function (d) { return d; },
        xTickValues = null,
        xTickTransform = function (d) { return ""; },
        showLegend = true,
        showGrid = false,
        showLabels = false,
        transition = true,
        legendContainer = null,
        fontSize = '10px',
        groupBy = function (d) { return d[0]; },
        events = {
            onBarSelected: null
        },
        xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(xTickFormat).tickSize(6, 0),
        yAxis = d3.svg.axis().scale(yScale).orient("left").tickFormat(yTickFormat),
        root = d3.select("body"),
        scr = { x: window.scrollX, y: window.scrollY, w: window.innerWidth, h: window.innerHeight },
        body_sel = d3.select("body"),
        body = { w: body_sel.node().offsetWidth, h: body_sel.node().offsetHeight },
        doc = { w: document.width, h: document.height },
        svgpos = getNodePos(root.node()),
        dist = { x: 10, y: 60 };

    function chart(selection) {

        if (xTickValues) xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(xTickFormat).tickSize(6, 0).tickValues(xTickValues);
        else xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(xTickFormat).tickSize(6, 0);
        yAxis = d3.svg.axis().scale(yScale).orient("left").tickFormat(yTickFormat);

        selection.each(function (data) {
            var sel = this;

            var xValues = _.uniq(data.map(function (d, i) { return xValue.call(data, d, i); }));

            domain = color.domain().length > 0 ? color.domain() : _.uniq(data.map(function (d, i) { return groupBy.call(data, d, i); }));
            color.domain(domain);
            //if (color.range().length > 0 && color.domain().length > 0) color.range().reverse();

            var groups = xValues.map(function (name) {
                var y0 = 0;
                return {
                    name: name,
                    totals: [data.filter(function (d) {
                        return xValue.call(data, d) == name;
                    }).map(function (d, i) {
                        return [xValue.call(data, d, i), yValue.call(data, d, i)];
                    }).reduce(function (prev, curr) {
                        return [prev[0], prev[1] + curr[1]];
                    })],
                    values: data.filter(function (d) {
                        return xValue.call(data, d) == name;
                    }).map(function (d, i) {
                        return [xValue.call(data, d, i), y0, y0 += yValue.call(data, d, i), groupBy.call(data, d, i), yValue.call(data, d, i)];
                    })
                };
            });

            xScale.domain(data.map(function (d, i) { return xValue.call(data, d, i); }))
                .rangeRoundBands([0, width - margin.left - margin.right], .1);

            x1Scale.domain(domain).rangeRoundBands([0, xScale.rangeBand()]);

            yScale.domain([
                0,
                d3.max(groups, function (c) {
                    return d3.max(c.values, function (v) {
                        return type == 'stacked' ? v[2] : v[4];
                    });
                })
            ]).rangeRound([height - margin.top - margin.bottom, 0]);

            if (d3.select(sel).selectAll("svg").empty()) {

                // Create a tooltip that we can use for hovering in all graphs in this tab
                var tooltip = d3.select(sel).append('div')
                    .attr('class', 'tooltip right')
                    .style('display', 'none');
                tooltip.append('div').attr('class', 'tooltip-arrow');
                tooltip.append('div').attr('class', 'tooltip-inner');

                var svg = d3.select(sel).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                if (showGrid) {
                    if (transition) {
                        svg.append("g")
                            .attr("class", "y grid")
                            .transition()
                            .duration(500)
                            .call(d3.svg.axis()
                                .scale(yScale)
                                .orient("left")
                                .tickSize(-width + margin.left + margin.right, 0, 0)
                                .tickFormat(""));
                    }
                    else {
                        svg.append("g")
                            .attr("class", "y grid")
                            .call(d3.svg.axis()
                                .scale(yScale)
                                .orient("left")
                                .tickSize(-width + margin.left + margin.right, 0, 0)
                                .tickFormat(""));
                    }
                }

                var group = svg.selectAll(".group")
                    .data(groups)
                    .enter().append("g")
                    .attr("class", "group");

                if (type == "stacked") {
                    var rect = group.selectAll("rect")
                        .data(function (d) { return d.values; })
                        .enter().append("rect")
                        .on("mouseover", function (d, i) {
                            var selectedRect = d3.select(this);
                            if (selectedRect.attr('opacity') > 0) {

                                if (events.onBarSelected) {
                                    selectedRect.attr("opacity", "0.9");
                                }

                                var tooltipHTML = '';
                                tooltipHTML += 'Group: ' + d[3] + '<br />Value: ' + labelFormat(d[4]);

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
                            }
                        })
                        .on("mousemove", function (d, i) {
                            var selectedRect = d3.select(this);
                            if (selectedRect.attr('opacity') > 0) {

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
                            }
                        })
                        .on("mouseout", function (d, i) {
                            var selectedRect = d3.select(this);
                            var tooltip = d3.select(sel).select('.tooltip');
                            if (selectedRect.attr('opacity') > 0) {
                                selectedRect.attr("opacity", "1");
                                tooltip.style("opacity", "0").style("display", "none").style('filter', 'alpha(opacity=0)');
                            }
                        })
                        .on("mousedown", function (d, i) {
                            if(events.onBarSelected) events.onBarSelected.call(this, d, i);
                        })
                        .attr("class", "bar")
                        .attr("opacity", "1.0")
                        .attr("data-xval", function (d) { return d[0] })
                        .attr("data-group", function (d) { return d[3] })
                        .attr("width", xScale.rangeBand())
                        .attr("y", height - margin.top - margin.bottom)
                        .attr("height", 0)
                        .style("cursor", function (d) {
                            if (events.onBarSelected) return "pointer";
                            return "default";
                        })
                        .style("fill", function (d) { return color(d[3]); });

                    if (showLabels) {
                        var labels = group.selectAll(".bar-text")
                            .data(function (d) { return d.values; })
                            .enter().append("text")
                            .attr("class", "bar-text")
                            .attr("text-anchor", "middle")
                            .attr("fill", "white")
                            .attr("font-size", fontSize)
                            .attr("x", function (d, i) {
                                return xScale(d[0]) + xScale.rangeBand() / 2;
                            })
                            .attr("y", function (d, i) {
                                return height - margin.top - margin.bottom;
                            })
                            .text(function (d) {
                                return labelFormat(d[4]);
                            });

                        labels.text(function (d) {
                            return yScale(d[1]) - yScale(d[2]) < 11 || xScale.rangeBand() < this.getBBox().width ? '' : labelFormat(d[4]);
                        });

                        var totalLabels = group.selectAll(".total-text")
                            .data(function (d) { return d['totals']; })
                            .enter().append("text")
                            .attr("class", "total-text")
                            .attr("text-anchor", "middle")
                            .attr("fill", "black")
                            .attr("font-size", fontSize)
                            .attr("font-weight", "bold")
                            .attr("x", function (d, i) {
                                return xScale(d[0]) + xScale.rangeBand() / 2;
                            })
                            .attr("y", function (d, i) {
                                return yScale(d[1]);
                            })
                            .text(function (d) {
                                return labelFormat(d[1]);   //parseFloat(d[1].toFixed(0));
                            });


                        if (transition) {
                            labels.transition()
                                .attr("y", function (d) { return yScale(d[2]) + (yScale(d[1]) - yScale(d[2])) / 2 + this.getBBox().height / 2; });
                            totalLabels.transition()
                                .attr("y", function (d, i) { return yScale(d[1]) - this.getBBox().height / 2; });
                        }
                        else {
                            labels.attr("y", function (d) { return yScale(d[2]) + (yScale(d[1]) - yScale(d[2])) / 2 + this.getBBox().height / 2; });
                            totalLabels.attr("y", function (d, i) { return yScale(d[1]) - this.getBBox().height / 2; });
                        }
                    }

                    if (transition) {
                        rect.transition()
                            .attr("x", function (d) { return xScale(d[0]); })
                            .attr("y", function (d) { return yScale(d[2]); })
                            .attr("height", function (d) { return yScale(d[1]) - yScale(d[2]); });
                    }
                    else {
                        rect.attr("x", function (d) { return xScale(d[0]); })
                            .attr("y", function (d) { return yScale(d[2]); })
                            .attr("height", function (d) { return yScale(d[1]) - yScale(d[2]); });
                    }

                }
                else {
                    var rect = group.selectAll("rect")
                        .data(function (d) { return d.values; })
                        .enter().append("rect")
                        .on("mouseover", function (d, i) {
                            var selectedRect = d3.select(this);
                            if (selectedRect.attr('opacity') > 0) {
                                var tooltipHTML = '';
                                tooltipHTML += 'Group: ' + d[3] + '<br />Value: ' + labelFormat(d[4]);

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
                            }
                        })
                        .on("mousemove", function (d, i) {
                            var selectedRect = d3.select(this);
                            if (selectedRect.attr('opacity') > 0) {

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
                            }
                        })
                        .on("mouseout", function (d, i) {
                            var selectedRect = d3.select(this);
                            var tooltip = d3.select(sel).select('.tooltip');
                            if (selectedRect.attr('opacity') > 0) {
                                tooltip.style("opacity", "0").style("display", "none").style('filter', 'alpha(opacity=0)');
                            }
                        })
                        .attr("class", "bar")
                        .attr("opacity", "1.0")
                        .attr("data-xval", function (d) { return d[0] })
                        .attr("data-group", function (d) { return d[3] })
                        .attr("x", function (d, i, j) { return x1Scale(d[3]) + xScale(d[0]); })
                        .attr("width", x1Scale.rangeBand())
                        .attr("y", height - margin.top - margin.bottom)
                        .attr("height", 0)
                        .style("fill", function (d) { return color(d[3]); });

                    if (showLabels) {
                        var yTextPadding = 5;

                        var labels = group.selectAll(".bar-text")
                            .data(function (d) { return d.values; })
                            .enter().append("text")
                            .attr("class", "bar-text")
                            .attr("text-anchor", "middle")
                            .style("opacity", function(d, i){ return x1Scale.rangeBand() < yTextPadding || d[4] == 0 ? "0" : "1"; })
                            .attr("fill", function (d, i) {
                                if ((height - margin.top - margin.bottom) - yScale(d[4]) < 12 && d[4] != 0) return "black";
                                return "white";
                            })
                            .attr("font-size", fontSize)
                            .attr("x", function (d, i) {
                                return x1Scale(d[3]) + xScale(d[0]) + x1Scale.rangeBand()/2;
                            })
                            .attr("y", function (d, i) {
                                return height - margin.top - margin.bottom;
                            })
                            .text(function (d) {
                                return labelFormat(d[4]);
                            });

                        if (transition) {
                            labels.transition()
                                .attr("y", function (d) { return (height - margin.top - margin.bottom) - yTextPadding; });
                        }
                        else {
                            labels.attr("y", function (d) { return (height - margin.top - margin.bottom) - yTextPadding; });
                        }
                    }

                    if (transition) {
                        rect.transition()
                            .attr("y", function (d) { return yScale(d[4]); })
                            .attr("height", function (d) { return (height - margin.top - margin.bottom) - yScale(d[4]); });
                    }
                    else {
                        rect.attr("y", function (d) { return yScale(d[4]); })
                            .attr("height", function (d) { return (height - margin.top - margin.bottom) - yScale(d[4]); });
                    }
                }

                var xAx = svg.append("g")
                    .attr("class", "x axis")
                    .style("font-size", fontSize)
                    .attr("transform", "translate(0," + yScale.range()[0] + ")")
                    .call(xAxis);
                xAx.append("text")
                    .attr("x", width - margin.left - margin.right)
                    .attr("y", -6)
                    .attr("class", "xLabel")
                    .style("text-anchor", "end")
                    .text(xLabel);

                xAx.selectAll('text').attr("transform", xTickTransform);

                svg.append("g")
                    .attr("class", "y axis")
                    .style("font-size", fontSize)
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .attr("class", "yLabel")
                    .style("text-anchor", "end")
                    .text(yLabel);

                if (showLegend) {
                    var lContainer = svg;
                    if (legendContainer) {
                        lContainer = d3.select(legendContainer)
                            .style('max-height', height + 'px')
                            .style('overflow-y', 'auto')
                            .style('overflow-x', 'hidden')
                            .append('svg')
                            .attr("width", d3.select(legendContainer).style('width'))
                            .attr("height", height + margin.top + margin.bottom)
                            .attr('class', 'legend-outer')
                            .append('svg')
                            .attr('class', 'legend-inner');
                    }

                    var legend = lContainer.selectAll(".legend")
                        .data(domain.slice().reverse())
                        .enter().append("g")
                        .on('mousedown', function (d) {
                            var legendUnderMouse = this,
                                selectedLegend = d3.select(this);
                            if (selectedLegend.attr("active") == "true") {
                                selectedLegend.attr('active', false).attr('opacity', 0.2);
                                updateChart(sel, groups, data, xValues);

                            }
                            else {
                                selectedLegend.attr("active", true).attr("opacity", 1.0);
                                updateChart(sel, groups, data, xValues);
                            }
                        })
                        .style("font-size", fontSize)
                        .style("cursor", "pointer")
                        .attr("active", true)
                        .attr("class", "legend")
                        .attr("transform", function (d, i) { return "translate(0," + i * 22 + ")"; });

                    if (!legendContainer) {
                        legend.append("rect")
                            .attr("x", width - margin.left - margin.right + 10)
                            .attr("width", 10)
                            .attr("height", 10)
                            .attr("unselectable", "on")
                            .style("-webkit-user-select", 'none')
                            .style("-ms-user-select", 'none')
                            .style("fill", color)
                            .style("stroke", color)
                            .style("stroke-width", "0px");

                        legend.append("text")
                            .attr("x", width - margin.left - margin.right + 25)
                            .attr("y", 0)
                            .attr("dy", ".75em")
                            .attr("unselectable", "on")
                            .style("-webkit-user-select", 'none')
                            .style("-ms-user-select", 'none')
                            .style("text-anchor", "start")
                            .style("font-weight", "bold")
                            .text(function (d) { return d; });
                    }
                    else {
                        legend.append("rect")
                            .attr("x", 5)
                            .attr("width", 10)
                            .attr("height", 10)
                            .attr("unselectable", "on")
                            .style("-webkit-user-select", 'none')
                            .style("-ms-user-select", 'none')
                            .style("fill", color)
                            .style("stroke", color)
                            .style("stroke-width", "0px");

                        legend.append("text")
                            .attr("x", 20)
                            .attr("y", 0)
                            .attr("dy", ".75em")
                            .attr("unselectable", "on")
                            .style("-webkit-user-select", 'none')
                            .style("-ms-user-select", 'none')
                            .style("text-anchor", "start")
                            .style("font-weight", "bold")
                            .text(function (d) { return d; });
                        d3.select(legendContainer).select('.legend-outer').attr('height', lContainer.node().getBBox()['height']);
                    }
                }
            }
            else {
                updateChart(sel, groups, data, xValues);
            }

        });
    }

    function updateChart(sel, groups, data, xValues) {

        var svg = d3.select(sel).select("svg")
            .attr("width", width)
            .attr("height", height)
            .select("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        domain = color.domain().length > 0 ? color.domain() : _.uniq(data.map(function (d, i) { return groupBy.call(data, d, i); }));

        var lContainer = svg;
        if (legendContainer) {
            lContainer = d3.select(legendContainer).select('.legend-inner');
        }

        var inactiveData = [];
        lContainer.selectAll(".legend").filter('[active="false"]').each(function (d, i) {
            inactiveData.push(d);
        });

        inactiveData = _.intersection(inactiveData, domain);

        groups = xValues.map(function (name) {
            var y0 = 0;
            return {
                name: name,
                totals: [data.filter(function (d) {
                    return xValue.call(data, d) == name;
                }).map(function (d, i) {
                    var y1 = _.indexOf(inactiveData, groupBy.call(data, d, i)) == -1 ? yValue.call(data, d, i) : 0;
                    return [xValue.call(data, d, i), y1];
                }).reduce(function (prev, curr) {
                    return [prev[0], prev[1] + curr[1]];
                })],
                values: data.filter(function (d) {
                    return xValue.call(data, d) == name;
                }).map(function (d, i) {
                    var y1 = _.indexOf(inactiveData, groupBy.call(data, d, i)) == -1 ? yValue.call(data, d, i) : 0;
                    return [xValue.call(data, d, i), y0, y0 += y1, groupBy.call(data, d, i), y1];
                })
            };
        });

        xScale.domain(data.map(function (d, i) { return xValue.call(data, d, i); }))
            .rangeRoundBands([0, width - margin.left - margin.right], .1);

        x1Scale.domain(domain).rangeRoundBands([0, xScale.rangeBand()]);

        // Update the y-scale.
        yScale.domain([
            0,
            d3.max(groups, function (c) {
                return d3.max(c.values, function (v) {
                    if(type == 'stacked')
                        return _.indexOf(inactiveData, v[3]) == -1 ? v[2] : 0;
                    else
                        return _.indexOf(inactiveData, v[3]) == -1 ? v[4] : 0;
                });
            })
        ]).rangeRound([height - margin.top - margin.bottom, 0]);

        // Update the x-axis.
        if (transition) {
            svg.select(".x.axis")
                .attr("transform", "translate(0," + yScale.range()[0] + ")")
                //.tickFormat(xTickFormat)
                .transition().call(xAxis)
                .selectAll("text")
                .attr("transform", xTickTransform);
        }
        else {
            svg.select(".x.axis")
                .attr("transform", "translate(0," + yScale.range()[0] + ")")
                //.tickFormat(xTickFormat)
                .call(xAxis)
                .selectAll("text")
                .attr("transform", xTickTransform);
        }

        // Update the y-axis.
        if (transition) {
            svg.select(".y.axis").transition().duration(500).call(yAxis);
        }
        else {
            svg.select(".y.axis").call(yAxis);
        }

        if (showGrid) {
            // Update grid lines
            if (transition) {
                svg.select(".y.grid")
                    .transition()
                    .duration(500)
                    .call(d3.svg.axis()
                        .scale(yScale)
                        .orient("left")
                        .tickSize(-width + margin.left + margin.right, 0, 0)
                        .tickFormat(""));
            }
            else {
                svg.select(".y.grid")
                    .call(d3.svg.axis()
                        .scale(yScale)
                        .orient("left")
                        .tickSize(-width + margin.left + margin.right, 0, 0)
                        .tickFormat(""));
            }
        }

        // Update x axis label positioning
        svg.selectAll('.xLabel')
            .attr("x", width - margin.left - margin.right)
            .attr("y", -6);

        updateLegend(sel, svg, groups, data, xValues);

        var gGroups = svg.selectAll(".group").data(groups);

        // Add new groups
        var eGroups = gGroups.enter().append("g")
            .attr("class", "group");

        var rGroups = gGroups.selectAll("rect").data(function (d) { return d.values; });
        var lGroups = gGroups.selectAll(".bar-text").data(function (d) { return d.values; });
        var tGroups = gGroups.selectAll(".total-text").data(function (d) { return d.totals; });

        if (type == "stacked") {
            // Update existing rects
            if (transition) {
                rGroups.style("fill", function (d) { return color(d[3]); })
                    .transition()
                    .attr("y", function (d) { return yScale(d[2]); })
                    .attr("height", function (d) { return yScale(d[1]) - yScale(d[2]); })
                    .transition()
                    .attr("x", function (d) { return xScale(d[0]); })
                    .attr("width", xScale.rangeBand());
            }
            else {
                rGroups.style("fill", function (d) { return color(d[3]); })
                    .attr("y", function (d) { return yScale(d[2]); })
                    .attr("height", function (d) { return yScale(d[1]) - yScale(d[2]); })
                    .attr("x", function (d) { return xScale(d[0]); })
                    .attr("width", xScale.rangeBand())
            }

            // Add any new rects
            var rect = rGroups.enter().append("rect")
                .on("mouseover", function (d, i) {
                    var selectedRect = d3.select(this);
                    if (selectedRect.attr('opacity') > 0) {

                        if (events.onBarSelected) {
                            selectedRect.attr("opacity", "0.9");
                        }

                        var tooltipHTML = '';
                        tooltipHTML += 'Group: ' + d[3] + '<br />Value: ' + labelFormat(d[4]);

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
                    }
                })
                .on("mousemove", function (d, i) {
                    var selectedRect = d3.select(this);
                    if (selectedRect.attr('opacity') > 0) {
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
                    }
                })
                .on("mouseout", function (d, i) {
                    var selectedRect = d3.select(this);
                    var tooltip = d3.select(sel).select('.tooltip');
                    if (selectedRect.attr('opacity') > 0) {
                        selectedRect.attr("opacity", "1");
                        tooltip.style("opacity", "0").style("display", "none").style('filter', 'alpha(opacity=0)');
                    }
                })
                .on("mousedown", function (d, i) {
                    if (events.onBarSelected) events.onBarSelected.call(this, d, i);
                })
                .attr("class", "bar")
                .attr("opacity", "1.0")
                .attr("width", xScale.rangeBand())
                .attr("x", function (d) { return xScale(d[0]); })
                .attr("y", height - margin.top - margin.bottom)
                .attr("height", 0)
                .style("cursor", function (d) {
                    if (events.onBarSelected) return "pointer";
                    return "default";
                })
                .style("fill", function (d) { return color(d[3]); });

            if (transition) {
                rect.transition()
                    .attr("y", function (d) { return yScale(d[2]); })
                    .attr("height", function (d) { return yScale(d[1]) - yScale(d[2]); });
            }
            else {
                rect.attr("y", function (d) { return yScale(d[2]); })
                    .attr("height", function (d) { return yScale(d[1]) - yScale(d[2]); });
            }

            if (showLabels) {
                if (transition) {
                    var labels = lGroups.transition()
                        .text(function (d) {
                            return d[4] == 0 ? d3.select(this).text() : labelFormat(d[4]);
                        })
                        .style("opacity", function (d) { return yScale(d[1]) - yScale(d[2]) < 5 ? '0' : "1"; })
                        .attr("y", function (d) { return yScale(d[2]) + (yScale(d[1]) - yScale(d[2])) / 2 + this.getBBox().height / 2; })
                        .transition()
                        .attr("x", function (d, i) { return xScale(d[0]) + xScale.rangeBand() / 2; })
                        .attr("fill", "white");

                    labels.style("opacity", function (d) {
                        return yScale(d[1]) - yScale(d[2]) < 11 || xScale.rangeBand() < this.getBBox().width ? '0' : '1';
                    });

                    // Update existing total labels
                    tGroups.transition()
                        .attr("x", function (d, i) {
                            return xScale(d[0]) + xScale.rangeBand() / 2;
                        })
                        .attr("y", function (d, i) {
                            return yScale(d[1]) - this.getBBox().height / 2;
                        })
                        .text(function (d) {
                            return labelFormat(d[1]);
                        });
                }
                else {
                    var labels = lGroups.text(function (d) {
                        return d[4] == 0 ? d3.select(this).text() : labelFormat(d[4]);
                    })
                        .style("opacity", function (d) { return yScale(d[1]) - yScale(d[2]) < 5 ? '0' : "1"; })
                        .attr("y", function (d) { return yScale(d[2]) + (yScale(d[1]) - yScale(d[2])) / 2 + this.getBBox().height / 2; })
                        .attr("x", function (d, i) { return xScale(d[0]) + xScale.rangeBand() / 2; })
                        .attr("fill", "white");

                    labels.style("opacity", function (d) {
                        return yScale(d[1]) - yScale(d[2]) < 11 || xScale.rangeBand() < this.getBBox().width ? '0' : '1';
                    });

                    // Update existing total labels
                    tGroups.attr("x", function (d, i) {
                        return xScale(d[0]) + xScale.rangeBand() / 2;
                    })
                        .attr("y", function (d, i) {
                            return yScale(d[1]) - this.getBBox().height / 2;
                        })
                        .text(function (d) {
                            return labelFormat(d[1]); //parseFloat(d[1].toFixed(0));
                        });
                }

                var labels = lGroups.enter().append("text")
                    .attr("class", "bar-text")
                    .attr("text-anchor", "middle")
                    .attr("fill", "white")
                    .attr("font-size", fontSize)
                    .style("opacity", function (d) { return yScale(d[1]) - yScale(d[2]) < 5 ? '0' : "1"; })
                    .attr("x", function (d, i) {
                        return xScale(d[0]) + xScale.rangeBand() / 2;
                    })
                    .attr("y", function (d, i) {
                        return height - margin.top - margin.bottom;
                    })
                    .text(function (d) {
                        return labelFormat(d[4]);
                    });

                labels.text(function (d) {
                    return yScale(d[1]) - yScale(d[2]) < 11 || xScale.rangeBand() < 10 ? '' : labelFormat(d[4]);
                });

                var titleLabels = tGroups.enter().append("text")
                    .attr("class", "total-text")
                    .attr("text-anchor", "middle")
                    .attr("fill", "black")
                    .attr("font-size", fontSize)
                    .attr("font-weight", "bold")
                    .attr("x", function (d, i) {
                        return xScale(d[0]) + xScale.rangeBand() / 2;
                    })
                    .attr("y", function (d, i) {
                        return yScale(d[1]);
                    })
                    .text(function (d) {
                        return labelFormat(d[1]);
                    });

                if (transition) {
                    labels.transition()
                        .attr("y", function (d) { return yScale(d[2]) + (yScale(d[1]) - yScale(d[2])) / 2 + this.getBBox().height / 2; });
                    titleLabels.transition()
                        .attr("y", function (d, i) { return yScale(d[1]) - this.getBBox().height / 2; });
                }
                else {
                    labels.attr("y", function (d) { return yScale(d[2]) + (yScale(d[1]) - yScale(d[2])) / 2 + this.getBBox().height / 2; });
                    titleLabels.attr("y", function (d, i) { return yScale(d[1]) - this.getBBox().height / 2; });
                }

                // Remove all stuff that doesn't have data anymore
                lGroups.exit().remove();
            }

        }
        else {

            // Update existing rects
            if (transition) {
                rGroups.style("fill", function (d) { return color(d[3]); })
                    .transition()
                    .attr("x", function (d, i, j) { return x1Scale(d[3]) + xScale(d[0]); })
                    .attr("width", x1Scale.rangeBand())
                    .transition()
                    .attr("y", function (d) { return yScale(d[4]); })
                    .attr("height", function (d) { return (height - margin.top - margin.bottom) - yScale(d[4]); });
            }
            else {
                rGroups.style("fill", function (d) { return color(d[3]); })
                    .attr("x", function (d, i, j) { return x1Scale(d[3]) + xScale(d[0]); })
                    .attr("width", x1Scale.rangeBand())
                    .attr("y", function (d) { return yScale(d[4]); })
                    .attr("height", function (d) { return (height - margin.top - margin.bottom) - yScale(d[4]); });
            }

            // Add any new rects
            var rect = rGroups.enter().append("rect")
                .on("mouseover", function (d, i) {
                    var selectedRect = d3.select(this);
                    if (selectedRect.attr('opacity') > 0) {

                        var tooltipHTML = '';
                        tooltipHTML += 'Group: ' + d[3] + '<br />Value: ' + labelFormat(d[4]);

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
                    }
                })
                .on("mousemove", function (d, i) {
                    var selectedRect = d3.select(this);
                    if (selectedRect.attr('opacity') > 0) {
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
                    }
                })
                .on("mouseout", function (d, i) {
                    var selectedRect = d3.select(this);
                    var tooltip = d3.select(sel).select('.tooltip');
                    if (selectedRect.attr('opacity') > 0) {
                        tooltip.style("opacity", "0").style("display", "none").style('filter', 'alpha(opacity=0)');
                    }
                })
                .attr("class", "bar")
                .attr("opacity", "1.0")
                .attr("x", function (d, i, j) { return x1Scale(d[3]) + xScale(d[0]); })
                .attr("width", x1Scale.rangeBand())
                .attr("y", height - margin.top - margin.bottom)
                .attr("height", 0)
                .style("fill", function (d) { return color(d[3]); });

            if (showLabels) {
                var yTextPadding = 5;

                if (transition) {
                    lGroups
                        .transition()
                        .attr("x", function (d, i) { return x1Scale(d[3]) + xScale(d[0]) + x1Scale.rangeBand() / 2; })
                        .transition()
                        .attr("y", function (d) { return (height - margin.top - margin.bottom) - yTextPadding; })
                        .style("opacity", function (d) { return x1Scale.rangeBand() < yTextPadding || d[4] == 0 ? "0" : "1"; })
                        .text(function (d) {
                            return d[4] == 0 ? d3.select(this).text() : labelFormat(d[4]);
                        })
                        .attr("fill", function (d, i) {
                            if ((height - margin.top - margin.bottom) - yScale(d[4]) < 12 && d[4] != 0) return "black";
                            return "white";
                        });
                }
                else {
                    lGroups.attr("x", function (d, i) { return x1Scale(d[3]) + xScale(d[0]) + x1Scale.rangeBand() / 2; })
                        .attr("y", function (d) { return (height - margin.top - margin.bottom) - yTextPadding; })
                        .style("opacity", function (d) { return x1Scale.rangeBand() < yTextPadding || d[4] == 0 ? "0" : "1"; })
                        .text(function (d) {
                            return d[4] == 0 ? d3.select(this).text() : labelFormat(d[4]);
                        })
                        .attr("fill", function (d, i) {
                            if ((height - margin.top - margin.bottom) - yScale(d[4]) < 12 && d[4] != 0) return "black";
                            return "white";
                        });
                }

                var labels = lGroups.enter().append("text")
                    .attr("class", "bar-text")
                    .attr("text-anchor", "middle")
                    .attr("fill", function (d, i) {
                        if ((height - margin.top - margin.bottom) - yScale(d[4]) < 12 && d[4] != 0) return "black";
                        return "white";
                    })
                    .attr("font-size", fontSize)
                    .style("opacity", function (d) { return x1Scale.rangeBand() < yTextPadding || d[4] == 0 ? "0" : "1"; })
                    .attr("x", function (d, i) {
                        return x1Scale(d[3]) + xScale(d[0]) + x1Scale.rangeBand() / 2;
                    })
                    .attr("y", function (d, i) {
                        return height - margin.top - margin.bottom;
                    })
                    .text(function (d) {
                        return labelFormat(d[4]);
                    });

                if (transition) {
                    labels.transition()
                        .attr("y", function (d) { return (height - margin.top - margin.bottom) - yTextPadding; })
                        .transition()
                        .text(function (d) {
                            return d[4] == 0 ? d3.select(this).text() : labelFormat(d[4]);
                        })
                        .style("opacity", function (d) { return x1Scale.rangeBand() < yTextPadding || d[4] == 0 ? "0" : "1"; })
                        .attr("fill", function (d, i) {
                            if ((height - margin.top - margin.bottom) - yScale(d[4]) < 12) return "black";
                            return "white";
                        });
                }
                else {
                    labels.attr("y", function (d) { return (height - margin.top - margin.bottom) - yTextPadding; })
                        .text(function (d) {
                            return d[4] == 0 ? d3.select(this).text() : labelFormat(d[4]);
                        })
                        .style("opacity", function (d) { return x1Scale.rangeBand() < yTextPadding || d[4] == 0 ? "0" : "1"; })
                        .attr("fill", function (d, i) {
                            if ((height - margin.top - margin.bottom) - yScale(d[4]) < 12) return "black";
                            return "white";
                        });
                }

                lGroups.exit().remove();    // Remove all stuff that doesn't have data anymore
            }

            if (transition) {
                rect.transition()
                    .attr("y", function (d) { return yScale(d[4]); })
                    .attr("height", function (d) { return (height - margin.top - margin.bottom) - yScale(d[4]); });
            }
            else {
                rect.attr("y", function (d) { return yScale(d[4]); })
                    .attr("height", function (d) { return (height - margin.top - margin.bottom) - yScale(d[4]); });
            }
        }

        gGroups.exit().remove();

        if (transition) {
            rGroups.exit().transition().attr("y", height - margin.top - margin.bottom).attr('height', 0).remove();
        }
        else {
            rGroups.exit().attr("y", height - margin.top - margin.bottom).attr('height', 0).remove();
        }
    }

    function updateLegend(sel, svg, groups, data, xValues) {
        var lContainer = svg;
        if (legendContainer) {
            lContainer = d3.select(legendContainer).select('.legend-inner');
        }

        var dLegend = lContainer.selectAll(".legend").data(domain.slice().reverse());

        var eLegend = dLegend.enter()
            .append("g")
            .on('mousedown', function (d) {
                var legendUnderMouse = this,
                    selectedLegend = d3.select(this);
                if (selectedLegend.attr("active") == "true") {
                    selectedLegend.attr('active', false).attr('opacity', 0.2);
                    updateChart(sel, groups, data, xValues);

                }
                else {
                    selectedLegend.attr("active", true).attr("opacity", 1.0);
                    updateChart(sel, groups, data, xValues);
                }
            })
            .style("font-size", fontSize)
            .style("cursor", "pointer")
            .attr("active", true)
            .attr("class", "legend")
            .attr("transform", function (d, i) { return "translate(0," + i * 22 + ")"; });

        if (!legendContainer) {
            eLegend.append("rect")
                .attr("x", width - margin.left - margin.right + 10)
                .attr("width", 10)
                .attr("height", 10)
                .attr("unselectable", "on")
                .style("-webkit-user-select", 'none')
                .style("-ms-user-select", 'none')
                .style("fill", function (d) { return color(d); })
                .style("stroke", function (d) { return color(d); })
                .style("stroke-width", "0px");

            eLegend.append("text")
                .attr("x", width - margin.left - margin.right + 25)
                .attr("y", 0)
                .attr("dy", ".75em")
                .attr("unselectable", "on")
                .style("-webkit-user-select", 'none')
                .style("-ms-user-select", 'none')
                .style("text-anchor", "start")
                .style("font-weight", "bold")
                .text(function (d) { return d; });

            var existingLegends = svg.selectAll('.legend');
            existingLegends.on('mousedown', null);
            existingLegends.on('mousedown', function (d) {
                var legendUnderMouse = this,
                    selectedLegend = d3.select(this);
                if (selectedLegend.attr("active") == "true") {
                    selectedLegend.attr('active', false).attr('opacity', 0.2);
                    updateChart(sel, groups, data, xValues);

                }
                else {
                    selectedLegend.attr("active", true).attr("opacity", 1.0);
                    updateChart(sel, groups, data, xValues);
                }
            });
            existingLegends.select('rect')
                .style("fill", function (d) { return color(d); })
                .style("stroke", function (d) { return color(d); });
            existingLegends.select('text').text(function (d) { return d; });

            svg.selectAll('.legend rect').attr('x', width - margin.left - margin.right + 10);
            svg.selectAll('.legend text').attr('x', width - margin.left - margin.right + 25);
        }
        else {
            eLegend.append("rect")
                .attr("x", 5)
                .attr("width", 10)
                .attr("height", 10)
                .attr("unselectable", "on")
                .style("-webkit-user-select", 'none')
                .style("-ms-user-select", 'none')
                .style("fill", function (d) { return color(d); })
                .style("stroke", function (d) { return color(d); })
                .style("stroke-width", "0px");

            eLegend.append("text")
                .attr("x", 20)
                .attr("y", 0)
                .attr("dy", ".75em")
                .attr("unselectable", "on")
                .style("-webkit-user-select", 'none')
                .style("-ms-user-select", 'none')
                .style("text-anchor", "start")
                .style("font-weight", "bold")
                .text(function (d) { return d; });

            var existingLegends = d3.select(legendContainer).selectAll('.legend');
            existingLegends.on('mousedown', null);
            existingLegends.on('mousedown', function (d) {
                var legendUnderMouse = this,
                    selectedLegend = d3.select(this);
                if (selectedLegend.attr("active") == "true") {
                    selectedLegend.attr('active', false).attr('opacity', 0.2);
                    updateChart(sel, groups, data, xValues);

                }
                else {
                    selectedLegend.attr("active", true).attr("opacity", 1.0);
                    updateChart(sel, groups, data, xValues);
                }
            });
            existingLegends.select('rect')
                .style("fill", function (d) { return color(d); })
                .style("stroke", function (d) { return color(d); });
            existingLegends.select('text').text(function (d) { return d; });

            d3.select(legendContainer).select('svg').selectAll('.legend rect').attr('x', 5);
            d3.select(legendContainer).select('svg').selectAll('.legend text').attr('x', 20);
        }

        dLegend.exit().remove();

        d3.select(legendContainer).select('.legend-outer').attr('height', lContainer.node().getBBox()['height']);
        d3.select(legendContainer).select('.legend-outer').attr('width', d3.select(legendContainer).style('width'));
    }

    chart.rootNode = function (_){
        if (!arguments.length) return root;
        root = _;
        return chart;
    };

    chart.type = function (_) {
        if (!arguments.length) return type;
        type = _;
        return chart;
    };

    chart.fontSize = function (_) {
        if (!arguments.length) return fontSize;
        fontSize = _;
        return chart;
    };

    chart.color = function (_) {
        if (!arguments.length) return color;
        color = _;
        return chart;
    };

    chart.labelFormat = function (_) {
        if (!arguments.length) return labelFormat;
        labelFormat = _;
        return chart;
    };

    chart.margin = function (_) {
        if (!arguments.length) return margin;
        margin = _;
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

    chart.transition = function (_) {
        if (!arguments.length) return transition;
        transition = _;
        return chart;
    };

    chart.tickValues = function (_) {
        if (!arguments.length) return xTickValues;
        xTickValues = _;
        return chart;
    };

    chart.xTickTransform = function (_) {
        if (!arguments.length) return xTickTransform;
        xTickTransform = _;
        return chart;
    };

    chart.xTickFormat = function (_) {
        if (!arguments.length) return xTickFormat;
        xTickFormat = _;
        return chart;
    };

    chart.yTickFormat = function (_) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = _;
        return chart;
    };

    chart.x = function (_) {
        if (!arguments.length) return xValue;
        xValue = _;
        return chart;
    };

    chart.y = function (_) {
        if (!arguments.length) return yValue;
        yValue = _;
        return chart;
    };

    chart.xAxisLabel = function (_) {
        if (!arguments.length) return xLabel;
        xLabel = _;
        return chart;
    };

    chart.yAxisLabel = function (_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return chart;
    };

    chart.xScale = function (_) {
        if (!arguments.length) return xScale;
        xScale = _;
        return chart;
    };

    chart.yScale = function (_) {
        if (!arguments.length) return yScale;
        yScale = _;
        return chart;
    };

    chart.groupBy = function (_) {
        if (!arguments.length) return groupBy;
        groupBy = _;
        return chart;
    };

    chart.onBarSelected = function (_) {
        if (!arguments.length) return events.onBarSelected;
        events.onBarSelected = _;
        return chart;
    };

    chart.showLegend = function (_) {
        if (!arguments.length) return showLegend;
        showLegend = _;
        return chart;
    };

    chart.legendContainer = function (_) {
        if (!arguments.length) return legendContainer;
        legendContainer = _;
        return chart;
    };

    chart.showLabels = function (_) {
        if (!arguments.length) return showLabels;
        showLabels = _;
        return chart;
    };

    chart.showGrid = function (_) {
        if (!arguments.length) return showGrid;
        showGrid = _;
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