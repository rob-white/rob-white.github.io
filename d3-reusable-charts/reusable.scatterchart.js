function ScatterChart() {
    var margin = { top: 20, right: 20, bottom: 40, left: 30 },
        width = 400,
        height = 200,
        color = d3.scale.category10(), // Default line colors
        xValue = function (d) { return d[0]; },
        yValue = function (d) { return d[1]; },
        xScale = d3.time.scale(),
        yScale = d3.scale.linear(),
        xLabel = 'X AXIS', // Default x-axis text label
        yLabel = 'Y AXIS', // Default y-axis text label
        showScaleInput = false,
        showLegend = true,
        showGrid = false,
        legendContainer = null,
        groupBy = function (d) { return d[0]; },
        sel = null,
        _data = [],
        overlays = [],
        xTickTransform = function (d) { return ""; },
        xTickFormat = function (d) {
            var format = d3.time.format('%b %d');
            return format(d);
        },
        dataId = function (d) { return d; },
        yTickFormat = d3.format("s"),
        xDomain = null,
        yDomain = null,
        transition = true,
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

        xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(xTickFormat).tickSize(6, 0);
        yAxis = d3.svg.axis().scale(yScale).orient("left").tickFormat(yTickFormat);

        selection.each(function (data) {
            sel = this;
            _data = data;

            color.domain(_.uniq(_data.map(function (d, i) { return groupBy.call(_data, d, i); })));

            var groups = color.domain().map(function (name) {
                return {
                    name: name,
                    values: _data.filter(function (d) { return groupBy.call(_data, d) == name; }).map(function (d, i) {
                        return [xValue.call(_data, d, i), yValue.call(_data, d, i)];
                    })
                };
            });

            // Update the x-scale.
            if (xDomain) {
                xScale.domain(xDomain).range([0, width - margin.left - margin.right]);
            }
            else {
                xScale.domain([
                    d3.min(groups, function (c) { return d3.min(c.values, function (v) { return v[0]; }); }),
                    d3.max(groups, function (c) { return d3.max(c.values, function (v) { return v[0]; }); })
                ])
                    .range([0, width - margin.left - margin.right]);
            }

            var inactiveData = [];
            if (showLegend) {
                var lContainer = d3.select(this).select("svg").select('g');
                if (legendContainer) {
                    lContainer = d3.select(legendContainer).select('.legend-inner');
                }
                lContainer.selectAll(".legend").filter('[active="false"]').each(function (d, i) {
                    inactiveData.push(d);
                });
                inactiveData = _.intersection(inactiveData, color.domain());
            }

            // Update the y-scale.
            if (yDomain) {
                yScale.domain(yDomain).range([height - margin.top - margin.bottom, 0]);
            }
            else {
                yScale.domain([
                    0,
                    d3.max(groups, function (c) {
                        return _.indexOf(inactiveData, c.name) == -1 ? d3.max(c.values, function (v) { return v[1]; }) : 0;
                    })
                ])
                    .range([height - margin.top - margin.bottom, 0]);
            }

            // Select the svg element, if it exists.
            if (d3.select(this).selectAll("svg").empty()) {
                // Create a tooltip that we can use for hovering in all graphs in this tab
                var tooltip = d3.select(sel).append('div')
                    .attr('class', 'tooltip right')
                    .style('position', 'absolute')
                    .style('pointer-events', 'none')
                    .style('display', 'none');
                tooltip.append('div').attr('class', 'tooltip-arrow');
                tooltip.append('div').attr('class', 'tooltip-inner');

                var g = d3.select(this).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                // Clip edges
                var id = d3.select(this).attr('id').replace("#", '');
                var clip = g.append("svg:clipPath")
                    .attr("id", "clip-" + id + "")
                    .append("svg:rect")
                    .attr("class", "clip-path")
                    .style("fill", "none")
                    .style("pointer-events", "all")
                    .attr("x", -margin.left)
                    .attr("y", -margin.top)
                    .attr("width", width)
                    .attr("height", height);

                var svg = g.append("g")
                    .attr("clip-path", "url(#clip-" + id + ")");

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

                var xAx = svg.append("g")
                    .attr("class", "x axis")
                    .style("font-size", "10px")
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
                    .style("font-size", "10px")
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .attr("class", "yLabel")
                    .style("text-anchor", "end")
                    .text(yLabel);

                var dots = svg.selectAll(".dot")
                    .data(_data, dataId)
                    .enter().append("circle")
                    .attr("class", 'dot')
                    .attr("group", function (d, i) {
                        return groupBy.call(_data, d, i);
                    })
                    .attr("opacity", 1)
                    .on("mouseover", function (d, i) {
                        var selectedDot = d3.select(this);
                        if (transition) selectedDot.transition().duration(100).attr('r', 5.5);
                        else selectedDot.attr('r', 5.5);

                        //
                        var tooltipHTML = '';
                        for (key in d) {
                            if(d[key] != null && d[key] != dataId(d)) tooltipHTML += key + ': ' + d[key] + '<br />';
                        }
                        //
                        var tooltip = d3.select(sel).select('.tooltip');

                        tooltip.select('.tooltip-inner')
                            .style('text-align', 'left')
                            .style('background-color', selectedDot.style('fill') == "rgb(255, 255, 255)" ? selectedDot.style('stroke') : selectedDot.style('fill'));

                        tooltip.style("opacity", "1")
                            .style("display", "block")
                            .style('filter', 'alpha(opacity=100)')
                        .select('.tooltip-inner')
                            .html(tooltipHTML);

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
                            tooltip.select('.tooltip-arrow').style('border-left-color', selectedDot.style('fill') == "rgb(255, 255, 255)" ? selectedDot.style('stroke') : selectedDot.style('fill'));
                            tooltip.attr("class", "tooltip left").style("left", (m[0] - tooltip.node().scrollWidth - dist.x) + "px");
                        }
                        else {
                            tooltip.select('.tooltip-arrow').style('border-right-color', selectedDot.style('fill') == "rgb(255, 255, 255)" ? selectedDot.style('stroke') : selectedDot.style('fill'));
                            tooltip.attr("class", "tooltip right").style("left", (m[0] + dist.x) + "px");
                        }
                        tooltip.style("top", (m[1] + root.node().scrollTop - tooltip.node().scrollHeight / 2) + "px");
                    })
                    .on("mouseout", function (d, i) {
                        // Transition all points to normal size
                        if (transition) d3.select(this).transition().duration(100).attr("r", 3.5);
                        else d3.select(this).attr("r", 3.5);

                        //Hide the tooltip
                        tooltip.style("opacity", "0").style("display", "none").style('filter', 'alpha(opacity=0)');
                    })
                    .attr("r", 3.5)
                    .attr("cx", function (d, i) { return xScale(xValue.call(_data, d, i)); })
                    .attr("cy", function (d, i) { return yScale(yValue.call(_data, d, i)); })
                    .style("fill", function (d, i) {
                        return color(groupBy.call(_data, d, i));
                    });

                if (showLegend) {
                    var lContainer = svg;
                    if (legendContainer) {
                        var container = d3.select(legendContainer)
                            .style('max-height', height + 'px')
                            .style('overflow-y', 'auto')
                            .style('overflow-x', 'hidden');

                        if (showScaleInput) {
                            container.append('input')
                                .attr('class', 'input-block-level')
                                .attr('placeholder', 'Scale')
                                .attr('type', 'text')
                                .on('input', function () {
                                    if (this.value.length > 0) {
                                        yDomain = [0, this.value];
                                    }
                                    else {
                                        yDomain = null;
                                    }
                                    updateChart();
                                });
                        }

                        lContainer = container.append('svg')
                            .attr("width", d3.select(legendContainer).style('width'))
                            .attr("height", height + margin.top + margin.bottom)
                            .attr('class', 'legend-outer')
                            .append('svg')
                            .attr('class', 'legend-inner');
                    }

                    var legend = lContainer.selectAll(".legend")
                        .data(color.domain())
                        .enter().append("g")
                        .on('mousedown', function (d) {
                            var legendUnderMouse = this,
                                selectedLegend = d3.select(this);
                            if (selectedLegend.attr("active") == "true") {
                                selectedLegend.attr('active', false).attr('opacity', 0.2);
                                updateChart();
                            }
                            else {
                                selectedLegend.attr("active", true).attr("opacity", 1.0);
                                updateChart();
                            }
                        })
                        .style("font-size", "10px")
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
                updateChart();
            }
        });
    }

    function updateChart() {
        // Update outer and inner dimensions
        var svg = d3.select(sel).select("svg")
            .attr("width", width)
            .attr("height", height)
            .select("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        d3.select(sel).select('.clip-path')
            .attr("width", width)
            .attr("height", height);

        color.domain(_.uniq(_data.map(function (d, i) { return groupBy.call(_data, d, i); }))); // Update color domain

        var lContainer = svg;
        if (legendContainer) lContainer = d3.select(legendContainer).select('.legend-inner');

        var inactiveData = [];
        lContainer.selectAll(".legend").filter('[active="false"]').each(function (d, i) {
            inactiveData.push(d);
        });

        inactiveData = _.intersection(inactiveData, color.domain());

        var groups = color.domain().map(function (name) {
            return {
                name: name,
                values: _data.filter(function (d, i) {
                    return groupBy.call(_data, d, i) == name && _.indexOf(inactiveData, groupBy.call(_data, d, i)) == -1;
                }).map(function (d, i) {
                    var y = _.indexOf(inactiveData, groupBy.call(_data, d, i)) == -1 ? yValue.call(_data, d, i) : 0;
                    return [xValue.call(_data, d, i), y];
                })
            };
        });

        groups = groups.filter(function (d, i) {
            return d.values.length > 0;
        });

        // Update the x-scale.
        if (xDomain) {
            xScale.domain(xDomain).range([0, width - margin.left - margin.right]);
        }
        else {
            xScale.domain([
                d3.min(groups, function (c) { return d3.min(c.values, function (v) { return v[0]; }); }),
                d3.max(groups, function (c) { return d3.max(c.values, function (v) { return v[0]; }); })
            ])
                .range([0, width - margin.left - margin.right]);
        }

        // Update the y-scale.
        if (yDomain) {
            yScale.domain(yDomain).range([height - margin.top - margin.bottom, 0]);
        }
        else {
            yScale.domain([
                0,
                d3.max(groups, function (c) {
                    return _.indexOf(inactiveData, c.name) == -1 ? d3.max(c.values, function (v) { return v[1]; }) : 0;
                })
            ])
                .range([height - margin.top - margin.bottom, 0]);
        }

        if (transition) {
            // Update the x-axis.
            svg.select(".x.axis")
                .transition()
                .call(xAxis)
                .selectAll("text")
                .attr("transform", xTickTransform);

            // Update the y-axis.
            svg.select(".y.axis")
                .transition()
                .call(yAxis);
        }
        else {
            svg.select(".x.axis").call(xAxis).selectAll("text").attr("transform", xTickTransform);;
            svg.select(".y.axis").call(yAxis);
        }

        // Update grid lines
        if (showGrid) {
            svg.select(".y.grid")
                .call(d3.svg.axis()
                    .scale(yScale)
                    .orient("left")
                    .tickSize(-width + margin.left + margin.right, 0, 0)
                    .tickFormat(""));
        }

        // Update x axis label positioning
        svg.selectAll('.xLabel')
            .attr("x", width - margin.left - margin.right)
            .attr("y", -6);

        var filteredData = _data.filter(function (d, i) {
            return _.indexOf(inactiveData, groupBy.call(_data, d, i)) == -1; // Grab all records that still need to be shown
        });

        updateDots(svg, filteredData);

        var lContainer = svg;
        if (legendContainer) lContainer = d3.select(legendContainer).select('.legend-inner');
        var dLegend = lContainer.selectAll(".legend").data(color.domain());
        var eLegend = dLegend.enter()
            .append("g")
            .on('mousedown', function (d) {
                var legendUnderMouse = this,
                    selectedLegend = d3.select(this);
                if (selectedLegend.attr("active") == "true") {
                    selectedLegend.attr('active', false).attr('opacity', 0.2);
                    updateChart();
                }
                else {
                    selectedLegend.attr("active", true).attr("opacity", 1.0);
                    updateChart();
                }
            })
            .style("font-size", "10px")
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
                    updateChart();

                }
                else {
                    selectedLegend.attr("active", true).attr("opacity", 1.0);
                    updateChart();
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
                    updateChart();
                }
                else {
                    selectedLegend.attr("active", true).attr("opacity", 1.0);
                    updateChart();
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

    function updateDots(svg, fData) {
        var gDots = svg.selectAll(".dot").data(fData, dataId);
        var tooltip = d3.select(sel).select('.tooltip');

        if (transition) {
            // Update dots and dot colors on chart
            gDots.attr("group", function (d, i) { return groupBy.call(fData, d, i); })
                .transition()
                .attr("cx", function (d, i) {
                    return xScale(xValue.call(fData, d, i));
                })
                .attr("cy", function (d, i) {
                    return yScale(yValue.call(fData, d, i));
                })
                .style("fill", function (d, i) {
                    return color(groupBy.call(fData, d, i));
                });
        }
        else {
            gDots.attr("group", function (d, i) { return groupBy.call(fData, d, i); })
                .attr("cx", function (d, i) {
                    return xScale(xValue.call(fData, d, i));
                })
                .attr("cy", function (d, i) {
                    return yScale(yValue.call(fData, d, i));
                })
                .style("fill", function (d, i) {
                    return color(groupBy.call(fData, d, i));
                });
        }

        // Add new dots that don't have data yet
        var eDots = gDots.enter()
            .append("circle")
            .attr("class", 'dot')
            .attr("group", function (d, i) {
                return groupBy.call(fData, d, i);
            })
            .attr("opacity", 1)
            .on("mouseover", function (d, i) {
                var selectedDot = d3.select(this);
                if (transition) selectedDot.transition().duration(100).attr('r', 5.5);
                else selectedDot.attr('r', 5.5);

                var tooltipHTML = '';
                for (key in d) {
                    if (d[key] != null && d[key] != dataId(d)) tooltipHTML += key + ': ' + d[key] + '<br />';
                }

                tooltip.select('.tooltip-inner')
                    .style('text-align', 'left')
                    .style('background-color', selectedDot.style('fill') == "rgb(255, 255, 255)" ? selectedDot.style('stroke') : selectedDot.style('fill'));

                tooltip.style("opacity", "1")
                    .style("display", "block")
                    .style('filter', 'alpha(opacity=100)')
                .select('.tooltip-inner')
                    .html(tooltipHTML);

                var m = d3.mouse(root.node());
                scr.x = window.scrollX;
                scr.y = window.scrollY;

                svgpos = getNodePos(root.node())
                m[1] += svgpos.y;
                tooltip.style("right", "");
                tooltip.style("left", "");
                tooltip.style("bottom", "");
                tooltip.style("top", "");

                if (m[0] >= window.innerWidth / 2) {
                    tooltip.select('.tooltip-arrow').style('border-left-color', selectedDot.style('fill') == "rgb(255, 255, 255)" ? selectedDot.style('stroke') : selectedDot.style('fill'));
                    tooltip.attr("class", "tooltip left").style("left", (m[0] - tooltip.node().scrollWidth - dist.x) + "px");
                }
                else {
                    tooltip.select('.tooltip-arrow').style('border-right-color', selectedDot.style('fill') == "rgb(255, 255, 255)" ? selectedDot.style('stroke') : selectedDot.style('fill'));
                    tooltip.attr("class", "tooltip right").style("left", (m[0] + dist.x) + "px");
                }
                tooltip.style("top", (m[1] + root.node().scrollTop - tooltip.node().scrollHeight / 2) + "px");
            })
            .on("mouseout", function (d, i) {
                // Transition this point to normal size
                if (transition) d3.select(this).transition().duration(100).attr("r", 3.5);
                else d3.select(this).attr("r", 3.5);

                //Hide the tooltip
                tooltip.style("opacity", "0").style("display", "none").style('filter', 'alpha(opacity=0)');
            })
            .attr("r", 0)
            .attr("cx", function (d, i) {
                return xScale(xValue.call(fData, d, i));
            })
            .attr("cy", function (d, i) {
                return yScale(yValue.call(fData, d, i));
            })
            .style("fill", function (d, i) {
                return color(groupBy.call(fData, d, i));
            });

        if (transition) eDots.transition().attr("r", 3.5);
        else eDots.attr("r", 3.5);

        // Remove all dots that don't have data anymore
        if (transition) gDots.exit().transition().attr("r", 0).remove();
        else gDots.exit().remove();
    }

    chart.rootNode = function (_){
        if (!arguments.length) return root;
        root = _;
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

    chart.showScaleInput = function (_) {
        if (!arguments.length) return showScaleInput;
        showScaleInput = _;
        return chart;
    };

    chart.xTickTransform = function (_) {
        if (!arguments.length) return xTickTransform;
        xTickTransform = _;
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

    chart.transition = function (_) {
        if (!arguments.length) return transition;
        transition = _;
        return chart;
    };

    chart.dataId = function (_) {
        if (!arguments.length) return dataId;
        dataId = _;
        return chart;
    };

    chart.xDomain = function (_) {
        if (!arguments.length) return xDomain;
        xDomain = _;
        return chart;
    };

    chart.yDomain = function (_) {
        if (!arguments.length) return yDomain;
        yDomain = _;
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

    chart.showLegend = function (_) {
        if (!arguments.length) return showLegend;
        showLegend = _;
        return chart;
    };

    chart.showGrid = function (_) {
        if (!arguments.length) return showGrid;
        showGrid = _;
        return chart;
    };

    chart.legendContainer = function (_) {
        if (!arguments.length) return legendContainer;
        legendContainer = _;
        return chart;
    };

    chart.groupBy = function (_) {
        if (!arguments.length) return groupBy;
        groupBy = _;
        return chart;
    };

    chart.color = function (_) {
        if (!arguments.length) return color;
        color = _;
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

    chart.overlays = function (_) {
        if (!arguments.length) return overlays;
        overlays = _;
        return chart;
    };

    // The x-accessor for the path generator; xScale ∘ xValue.
    function X(d) {
        return xScale(d[0]);
    }

    // The x-accessor for the path generator; yScale ∘ yValue.
    function Y(d) {
        return yScale(d[1]);
    }

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