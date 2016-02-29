(function() {
    'use strict';

    angular.module('ngD3Example.widgets', []);
})();

angular.module("ngD3Example.widgets").run(["$templateCache", function($templateCache) {$templateCache.put("app/widgets/bar-line-chart.html","<div><div>{{::vm.title}}</div><div class=chart-content-container flex></div></div>");}]);
(function () {
    'use strict';

    barLineChart.$inject = ["viewportUtils", "delayedTaskFactory"];
    angular
        .module('ngD3Example.widgets')
        .directive('barLineChart', barLineChart);

    /* @ngInject */
    function barLineChart (viewportUtils, delayedTaskFactory) {
        BarLineChartController.$inject = ["$element", "barLineChartFactory", "chartUtils"];
        var directive = {
            replace: true,
            bindToController: true,
            controller: BarLineChartController,
            controllerAs: 'vm',
            restrict: 'EA',
            scope: {
                title: '@',
                barSeriesValueField: '@',
                lineSeriesValueField: '@',
                xAxisValueField: '@',
                chartData: '='

            },
            templateUrl: 'app/widgets/bar-line-chart.html',
            link: function(scope, element, attrs, vm) {
                var delayedDrawChartTask = delayedTaskFactory.create(function () {
                    vm.drawChart();
                });

                function delayedDrawChart() {
                    if (delayedDrawChartTask) {
                        delayedDrawChartTask.delay(50);
                    }
                }

                viewportUtils.watchWindowSize(scope, delayedDrawChart);
                scope.$watchCollection('vm.chartData', vm.drawChart);
            }
        };

        /* @ngInject */
        function BarLineChartController($element, barLineChartFactory, chartUtils) {
            var vm = this,
                chart = barLineChartFactory.create(),
                chartContainerEl = $element.find('.chart-content-container');


            vm.drawChart = function() {

                var parentDom = chartContainerEl[0],
                    el = d3.select(parentDom),
                    chartHeight = parentDom.clientHeight,
                    chartWidth = parentDom.clientWidth,
                    svg = chartUtils.selectOrNew(el, 'svg', 'bar-line-chart');

                svg.attr({
                    width: chartWidth,
                    height: chartHeight
                });

                chart.width(chartWidth)
                    .height(chartHeight)
                    .barSeriesValueField(vm.barSeriesValueField)
                    .lineSeriesValueField(vm.lineSeriesValueField)
                    .xAxisValueField(vm.xAxisValueField);

                d3.select(svg)
                    .datum(vm.chartData)
                    .call(chart);
            }

        }

        return directive;
    }
})();

(function () {
    'use strict';

    angular
        .module('ngD3Example.widgets')
        .factory('tooltipFactory', tooltipFactory);

    /* @ngInject */
    function tooltipFactory() {
        var tooltipFactory = {
            create: function () {
                return new tooltipGenerator();
            }
        };

        function tooltipGenerator() {
            var tooltipFn , highLightFn, highLightOutFn;

            function exports(selection) {

                var tooltipDiv;
                var bodyNode = d3.select('body').node();

                function setupTooltip() {
                    // Clean up lost tooltips
                    d3.select('body').selectAll('div.d3-tooltip').remove();
                    // Append tooltip
                    tooltipDiv = d3.select('body').append('div').attr('class', 'd3-tooltip');
                }

                function positionTooltip() {
                    var absoluteMousePos = d3.mouse(bodyNode);
                    tooltipDiv.style('left', (absoluteMousePos[0] + 5) + 'px')
                        .style('top', (absoluteMousePos[1] - 40) + 'px');
                }

                function updateTooltipText(d, i) {
                    var tooltipText;
                    if(_.isFunction(tooltipFn)) {
                        tooltipText = tooltipFn(d, i);
                    }
                    if (_.isUndefined(tooltipText)) {
                        removeTooltip();
                    } else {
                        if (tooltipDiv) {
                            tooltipDiv.html(tooltipText);
                        }
                    }
                }

                function removeTooltip() {
                    if (tooltipDiv) {
                        tooltipDiv.remove();
                    }
                    if (_.isFunction(highLightOutFn)) {
                        d3.select(this).call(highLightOutFn);
                    }
                }

                function addTooltip(d, i) {
                    setupTooltip();
                    positionTooltip();
                    updateTooltipText(d, i);
                    if(_.isFunction(highLightFn)) {
                        d3.select(this).call(highLightFn);
                    }
                }

                selection.on('mouseover', addTooltip)
                    .on('touchstart', addTooltip)
                    .on('mousemove', positionTooltip)
                    .on('touchmove', positionTooltip)
                    .on('mouseout', removeTooltip)
                    .on('touchend', removeTooltip);
            }

            exports.tooltipFn = function (fnIn) {
                if (!arguments.length) {
                    return tooltipFn;
                }

                tooltipFn = fnIn;
                return this;
            };
            exports.highlightFn = function(fnIn) {
                if (!arguments.length) {
                    return highLightFn;
                }
                highLightFn = fnIn;
                return this;
            };
            exports.highlightOutFn = function(fnIn) {
                if (!arguments.length) {
                    return highLightOutFn;
                }
                highLightOutFn = fnIn;
                return this;
            }

            return exports;

        }
        return tooltipFactory;
    }
})();
(function () {
    'use strict';

    angular
        .module('ngD3Example.widgets')
        .factory('chartUtils', chartUtils);

    /* @ngInject */
    function chartUtils() {

        var chartUtilsFactory = {
            selectOrNew : selectOrNew,
            calculateMaxValue: calculateMaxValue,
            calculateMinValue: calculateMinValue
        };


        function mergeClassNames(origClassString, newClassString) {
            if (!newClassString) {
                return origClassString;
            } else if (!origClassString) {
                return newClassString;
            }

            var origClasses = origClassString.split(' '),
                newClasses = newClassString.split(' ');

            var allClasses = _.union(origClasses, newClasses);
            return allClasses.join(' ');
        }

        function convertClassNameToClassSelector(className) {
            var classSelector = null;

            if (className) {
                classSelector = _.startsWith(className, '.')? className : '.' + className;
                classSelector = classSelector.replace(/\s+/, '.');
            }

            return classSelector;
        }
        /**
         * Perform D3 select operation and return the child element.  Append a new element if it does not already exist
         * @param {Object} parentEl Parent D3 element
         * @param {String} type E.g. g, rect
         * @param {String} [className] Optional css class name used to search for the element
         * @param {Object} [attrConfig] Optional attribute config object to be set to the newly created element
         * @returns {Object} child element
         */
        function selectOrNew(parentEl, type, className, attrConfig) {
            var classSelector = convertClassNameToClassSelector(className);

            var el = parentEl.select(classSelector ? type + classSelector : type);
            if (el.empty()) {
                el = parentEl.append(type);
                if (className) {
                    attrConfig = attrConfig || {};
                    attrConfig.class = attrConfig.class?
                        mergeClassNames(attrConfig.class, className) : className;
                }

                if (attrConfig) {
                    el.attr(attrConfig);
                }
            }

            return el;
        }

        function calculateMaxValue(data, fieldName) {
            var defaultMaxVal = 1;

            var calculatedMaxValue = _.isEmpty(data) ? defaultMaxVal : d3.max(data, function (d) {
                return Number(d[fieldName]);
            });
            calculatedMaxValue = (_.isNull(calculatedMaxValue) || _.isUndefined(calculatedMaxValue)) ? defaultMaxVal : calculatedMaxValue;

            return calculatedMaxValue;
        }

        function calculateMinValue(data, fieldName) {
            var defaultMinValue = 0;
            var calculatedMinValue = _.isEmpty(data) ? defaultMinValue : d3.min(data, function (d) {
                return Number(d[fieldName]);
            });
            calculatedMinValue = (_.isNull(calculatedMinValue) || _.isUndefined(calculatedMinValue) || calculatedMinValue > 0) ? defaultMinValue : calculatedMinValue;
            return calculatedMinValue;
        }

        return chartUtilsFactory
    }
})();

(function () {
    'use strict';

    barLineChartFactory.$inject = ["chartUtils", "tooltipFactory", "$rootScope"];
    angular
        .module('ngD3Example.widgets')
        .factory('barLineChartFactory', barLineChartFactory);

    /* @ngInject */
    function barLineChartFactory(chartUtils, tooltipFactory, $rootScope) {
        var chartFactory = {
            create: function () {
                return new LineBarChart();
            }
        };

        function LineBarChart() {
            var barRectCls = 'bar-rect',
                barRectSelectedCls = 'bar-rect-selected',
                dotRadius = 4,
                dotHighlightRadius = 8,
                lineSeriesDotsCls = 'line-dot',
                lineDotSelectedCls = 'line-dot-selected',
                marginLeft = 70, // space for drawing Y left axis
                marginRight = 70, // Space for drawing Y right axis
                marginTop = 20,
                marginBottom = 50; // space for drawing x-axis w labels in bottom

            var props = {
                width: undefined,
                height: undefined,
                barSeriesValueField: 'valueLeft',
                lineSeriesValueField: 'valueRight',
                xAxisValueField: 'label'
            }

            function exports(selection) {
                selection.each(function(data) {
                    marginLeft = $rootScope.viewportXs ? 5 : 70;
                    marginRight = $rootScope.viewportXs ? 5 : 70;

                    var containerEl = this,
                        chartPlotWidth = props.width - (marginLeft + marginRight),
                        chartPlotHeight = props.height - (marginTop + marginBottom);

                    var chartGrp = chartUtils.selectOrNew(containerEl, 'g', 'line-bar-grp')
                        .attr('transform', 'translate(' + marginLeft + ',' +  marginTop + ')');

                    //X-axis ==========================================
                    // space reserved for margin is used for drawing Y Axis on Left and Right side and remaining space is
                    // used for drawing chart series or x-axis.
                    // space for drawing is
                    var xScale = d3.scale.ordinal()
                        .rangeRoundBands([0, chartPlotWidth], .05)
                        .domain(data.map(function(d) { return d[props.xAxisValueField]; }));

                    var xAxis = d3.svg.axis()
                        .scale(xScale)
                        .orient('bottom')
                        .innerTickSize(-chartPlotHeight)
                        .outerTickSize(0)
                        .tickPadding(10);

                    var xAxisGrp = chartUtils.selectOrNew(chartGrp, 'g', 'x axis');
                    xAxisGrp.attr('transform', 'translate(' + 0 + ',' +  chartPlotHeight + ')')
                        .call(xAxis);

                    xAxisGrp.selectAll('text')
                        .style('text-anchor', 'middle')
                        .attr("dy", ".15em");

                    //~ ------- Drawing series -------------------------


                    var barWidth = xScale.rangeBand(),
                        calculatedMaxValueLeftAxis = chartUtils.calculateMaxValue(data, props.barSeriesValueField),
                        calculatedMaxValueRightAxis = chartUtils.calculateMaxValue(data, props.lineSeriesValueField),
                        calculatedMinValueLeftAxis = chartUtils.calculateMinValue(data, props.barSeriesValueField),
                        calculatedMinValueRightAxis = chartUtils.calculateMinValue(data, props.lineSeriesValueField);

                    // Y-Axis Left For Bar Series ==========================================
                    var rawYScale = d3.scale.linear()
                        .range([chartPlotHeight, 0])
                        .domain([calculatedMinValueLeftAxis, calculatedMaxValueLeftAxis]);

                    var yScale = function (val) {
                        //Fall back to 0 to prevent those NaN errors when we don't have data
                        return rawYScale(val || 0) || 0;
                    };

                    var yAxisLeftOrient = $rootScope.viewportXs ? 'right' : 'left';

                    var yAxisLeft = d3.svg.axis()
                        .scale(rawYScale)
                        .orient(yAxisLeftOrient)
                        .ticks(5)
                        .outerTickSize(0)
                        .tickPadding(5);

                    drawBarSeries(xScale, yScale, barWidth, data, chartGrp);

                    var yAxisLeftGrp = chartUtils.selectOrNew(chartGrp, 'g', 'y-left').classed('axis', true);
                    yAxisLeftGrp.call(yAxisLeft);


                    // Y-Axis Right for Line Series ============================================
                    var yScaleRight = d3.scale.linear()
                        .range([chartPlotHeight, 0])
                        .domain([calculatedMinValueRightAxis, calculatedMaxValueRightAxis]);

                    drawLineSeries(xScale, yScaleRight, data, chartGrp);

                    var yAxisRightOrient = $rootScope.viewportXs ? 'left' : 'right';

                    var yAxisRight = d3.svg.axis()
                        .scale(yScaleRight)
                        .orient(yAxisRightOrient)
                        .ticks(5);

                    var yAxisRightGrp = chartUtils.selectOrNew(chartGrp, 'g', 'y-right').classed('axis', true);
                    yAxisRightGrp
                        .attr('transform', 'translate(' + (chartPlotWidth) + ',' + 0 + ')')
                        .call(yAxisRight);

                });
            }

            function drawLineSeries(xScale, yScale, data, chartGrp) {
                var tip = tooltipFactory.create()
                    .tooltipFn(function(d, i) {
                        var value = d[props.lineSeriesValueField],
                            label = d[props.xAxisValueField];
                        return label + ' : ' + value;

                    })
                    .highlightFn(function() {
                        this.attr('r', dotHighlightRadius)
                            .classed(lineDotSelectedCls, true)
                            .transition()
                            .duration(1000);
                    })
                    .highlightOutFn(function() {
                        this.attr('r', dotRadius)
                            .classed(lineDotSelectedCls, false)
                            .transition()
                            .duration(1000);
                    });

                var xPositionFn = function(d, i) {
                    return xScale(d[props.xAxisValueField]) + (xScale.rangeBand() / 2);
                };
                var yPositionFn = function(d) {
                    if (isNaN(yScale(d[props.lineSeriesValueField]))) {
                        return yScale(0);
                    }
                    return yScale(d[props.lineSeriesValueField]);
                };

                var lineFn = d3.svg.line()
                    .x(xPositionFn)
                    .y(yPositionFn);


                var linesGrp = chartUtils.selectOrNew(chartGrp, 'g', 'lines-grp');
                //~ Lines ---------------
                var seriesLines = linesGrp.selectAll('path.line')
                    .data(data);

                //New cycle
                seriesLines.enter().append('path')
                    .classed('line', true);

                //remove cycle
                seriesLines.exit().remove();
                //Update Cycle
                linesGrp.selectAll('path.line')
                    .attr('d', lineFn(data))
                    .style('fill', 'none');

                //~ Dots on plotted point ----------
                var lineDotsGrp = chartUtils.selectOrNew(chartGrp, 'g', 'line-dots-grp');
                var seriesDots = lineDotsGrp.selectAll('circle')
                    .data(data || []);
                //New cycle
                seriesDots.enter().append('circle').call(tip);
                //Remove cycle
                seriesDots.exit().remove();
                // Update cycle
                lineDotsGrp.selectAll('circle')
                    .classed(lineSeriesDotsCls, true)
                    .attr('r', dotRadius)
                    .attr('cx', xPositionFn)
                    .attr('cy', yPositionFn);

            }

            function drawBarSeries(xScale, yScale, barWidth, data, chartGrp) {
                var tip = tooltipFactory.create()
                    .tooltipFn(function(d) {
                        var value = d[props.barSeriesValueField],
                            label = d[props.xAxisValueField];
                        return label + ' : ' + value;
                    })
                    .highlightFn(function() {
                        this.classed(barRectSelectedCls, true)
                            .transition()
                            .duration(1000);
                    })
                    .highlightOutFn(function() {
                        this.classed(barRectSelectedCls, false)
                            .transition()
                            .duration(1000);
                    });

                var barChartGrp = chartUtils.selectOrNew(chartGrp, 'g', 'bar-chart-grp')
                // Bar Grps - attach data
                var barGrps = barChartGrp.selectAll('g.bar-grp')
                    .data(data || []);

                // New Cycle -----------------------
                var newBarGrps = barGrps.enter().append('g')
                    .attr('class', 'bar-grp');
                newBarGrps.append('rect')
                    .attr('class', barRectCls)
                    .call(tip);


                // Remove cycle ------------------------
                barGrps.exit().remove();

                // Update cycle -------------------
                barGrps.attr('transform', function (d, i) {
                    return 'translate(' + (xScale(d[props.xAxisValueField])) + ',' + 0 + ')'
                });

                // Updating each bar
                var rectBar = barGrps.select('rect')
                    .classed(barRectCls, true)
                    .attr('width', barWidth);

                rectBar.attr('y', function(d) {
                    return yScale(d[props.barSeriesValueField]);
                })
                .attr('height', function(d) { return Math.max(1, yScale(0) - yScale(d[props.barSeriesValueField])); });
            }

            exports.width = function (w) {
                if (!arguments.length) {
                    return props.width;
                }
                props.width = w;
                return this;
            };
            exports.height = function(h) {
                if (!arguments.length) {
                    return props.height;
                }
                props.height = h;
                return this;
            };
            exports.barSeriesValueField = function(valueField) {
                if (!arguments.length) {
                    return props.barSeriesValueField;
                }
                props.barSeriesValueField = valueField;
                return this;
            };
            exports.lineSeriesValueField = function(valueField) {
                if (!arguments.length) {
                    return props.lineSeriesValueField;
                }
                props.lineSeriesValueField = valueField;
                return this;
            };
            exports.xAxisValueField = function(valueField) {
                if (!arguments.length) {
                    return props.xAxisValueField;
                }
                props.xAxisValueField = valueField;
                return this;
            };
            return exports;
        }
        return chartFactory;
    }
})();
(function() {
    'use strict';

    angular.module('ngD3Example.core', ['ngAnimate', 'ngAria', 'ngMessages', 'ngMaterial']);
})();

(function () {
    'use strict';

    viewportUtils.$inject = ["$window", "$mdMedia", "$rootScope"];
    angular
        .module('ngD3Example.core')
        .factory('viewportUtils', viewportUtils);

    /* @ngInject */
    function viewportUtils($window, $mdMedia, $rootScope) {
        var utils = {
            watchWindowSize: watchWindowSize
        }

        function onWindowResize(listener) {
            var winEl = angular.element($window);
            winEl.bind('resize', listener);

            return function () {
                winEl.unbind('resize', listener);
            };
        }

        function watchWindowSize(scope, listener) {
            var unRegisterFxn = onWindowResize(listener);

            scope.$on('$destroy', unRegisterFxn);
        }
        // Wrapper around ng materials breakpoints https://material.angularjs.org/HEAD/api/service/$mdMedia
        // In this way we can use media query  breakpoints on angular templates if necessary.
        // Also this way we can expose application specific media query points by hiding implementation details
        // in service class.

        $rootScope.viewportXs = $mdMedia('xs');
        $rootScope.$watch(function() { return $mdMedia('xs'); }, function(val) {
            $rootScope.viewportXs = val;
        });

        $rootScope.viewportGtXs = $mdMedia('gt-xs');
        $rootScope.$watch(function() { return $mdMedia('gt-xs'); }, function(val) {
            $rootScope.viewportGtXs = val;
        });

        $rootScope.viewportSm = $mdMedia('sm');
        $rootScope.$watch(function() { return $mdMedia('sm'); }, function(val) {
            $rootScope.viewportSm = val;
        });

        $rootScope.viewportGtSm = $mdMedia('gt-sm');
        $rootScope.$watch(function() { return $mdMedia('gt-sm'); }, function(val) {
            $rootScope.viewportGtSm = val;
        });

        $rootScope.viewportMd = $mdMedia('md');
        $rootScope.$watch(function() { return $mdMedia('md'); }, function(val) {
            $rootScope.viewportMd = val;
        });

        $rootScope.viewportGtMd = $mdMedia('gt-md');
        $rootScope.$watch(function() { return $mdMedia('gt-md'); }, function(val) {
            $rootScope.viewportGtMd = val;
        });

        $rootScope.viewportLarge = $mdMedia('lg');
        $rootScope.$watch(function() { return $mdMedia('lg'); }, function(val) {
            $rootScope.viewportLarge = val;
        });

        $rootScope.viewportGtLg = $mdMedia('gt-lg');
        $rootScope.$watch(function() { return $mdMedia('gt-lg'); }, function(val) {
            $rootScope.viewportGtLg = val;
        });

        return utils;
    }
})();

(function () {
    'use strict';

    // Define module and dependencies.
    delayedTaskFactory.$inject = ["$timeout"];
    angular
        .module('ngD3Example.core')
        .factory('delayedTaskFactory', delayedTaskFactory);

    /* @ngInject */
    function delayedTaskFactory($timeout) {
        function DelayedTask(fn) {
            this.fn = fn;
            this.promise = null;
        }

        DelayedTask.prototype.delay = function(delayInMillis, fnArgs) {
            var me = this;
            if (me.promise) {
                me.cancel();
            }

            this.promise = $timeout(function() {
                me.promise = null;
                me.fn.apply(me, fnArgs);
            }, delayInMillis);
        };

        DelayedTask.prototype.cancel = function() {
            var me = this;
            $timeout.cancel(me.promise);
            me.promise = null;
        };

        return {
            create: function(fn) {
                return new DelayedTask(fn);
            }
        };
    }
})();
