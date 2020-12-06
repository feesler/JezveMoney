'use strict';

/* global ce, svg, prependChild, isFunction, extend, Component */
/* exported BaseChart */

/**
 * Base chart component constructor
 * @param {Object} props
 * @param {string|Element} props.elem - base element for component
 */
function BaseChart() {
    BaseChart.parent.constructor.apply(this, arguments);

    this.chartsWrapObj = null;
    this.chart = null;
    this.chartContent = null;
    this.verticalLabels = null;
    this.r = null;
    this.lr = null;
    this.paperHeight = 300;
    this.hLabelsHeight = 20;
    this.vLabelsWidth = 10;
    this.chartMarginTop = 10;
    this.barMargin = 10;
    this.barWidth = 0;
    this.chartWidth = 0;
    this.chartHeight = 0;
    this.chartContentWidth = 0;
    this.data = {};
    this.items = [];
    this.gridLines = [];
    this.vertLabels = [];
    this.fitToWidth = false;
    this.autoScale = false;
    this.itemClickHandler = null;
    this.scrollHandler = null;
    this.itemOverHandler = null;
    this.itemOutHandler = null;

    this.init();
}

extend(BaseChart, Component);

/** Initialization of chart */
BaseChart.prototype.init = function () {
    var minVal;
    var maxVal;
    var grid;
    var getHeight;
    var vBars;
    var values;
    var zeroBaseValues;

    if (
        !this.elem
        || !this.props
        || !this.props.data
        || !this.props.data.values
        || !this.props.data.series
    ) {
        throw new Error('Invalid chart properties');
    }

    this.data = this.props.data;

    if ('widthFit' in this.props) {
        this.fitToWidth = this.props.widthFit;
    }
    if ('autoScale' in this.props) {
        this.autoScale = this.props.autoScale;
    }
    if ('height' in this.props) {
        this.paperHeight = parseInt(this.props.height, 10);
    }

    this.scrollHandler = isFunction(this.props.onscroll) ? this.props.onscroll : null;
    this.itemClickHandler = isFunction(this.props.onitemclick) ? this.props.onitemclick : null;
    this.itemOverHandler = isFunction(this.props.onitemover) ? this.props.onitemover : null;
    this.itemOutHandler = isFunction(this.props.onitemout) ? this.props.onitemout : null;

    // Vertical labels
    this.verticalLabels = ce('div');

    // Histogram
    this.chart = ce('div');
    this.chartContent = ce('div', { className: 'chart_content' }, this.chart);

    this.chartsWrapObj = ce('div', { className: 'charts' }, [
        ce('div', { className: 'chart_wrap' }, this.chartContent),
        ce('div', { className: 'vertical-legend' }, this.verticalLabels)
    ]);
    this.elem.appendChild(this.chartsWrapObj);

    this.chartContent.onscroll = this.onScroll.bind(this);

    this.chartHeight = this.paperHeight - this.hLabelsHeight - this.chartMarginTop;
    this.barWidth = 38;
    zeroBaseValues = this.getZeroBased(this.data.values);
    minVal = this.getMin(zeroBaseValues);
    maxVal = this.getMax(zeroBaseValues);
    getHeight = this.convertRelToAbs(minVal, maxVal, this.chartHeight);

    this.lr = svg('svg', { width: this.vLabelsWidth, height: this.paperHeight + 20 });
    this.verticalLabels.appendChild(this.lr);

    // create grid
    grid = this.calculateGrid(minVal, maxVal, this.chartHeight, this.chartMarginTop);

    this.drawVLabels(this.lr, grid);

    if (this.fitToWidth) {
        this.barWidth = (this.chart.parentNode.offsetWidth / (this.data.values.length + 1));
        if (this.barWidth > 10) {
            this.barMargin = this.barWidth / 5;
            this.barWidth -= this.barMargin * 4;
        } else {
            this.barMargin = 0;
        }
    }

    this.chartContentWidth = (this.data.values.length) * (this.barWidth + this.barMargin);
    this.chartWidth = Math.max(this.chart.offsetWidth, this.chartContentWidth);

    this.r = svg('svg', { width: this.chartWidth, height: this.paperHeight });
    this.chart.appendChild(this.r);

    this.removeElements(this.gridLines);
    this.gridLines = this.drawGrid(this.r, grid, this.chartWidth);

    // create bars
    this.createItems();

    if (this.autoScale) {
        vBars = this.getVisibleItems();
        values = this.mapValues(vBars);

        // zeroBaseValues = values.concat(0);
        zeroBaseValues = this.getZeroBased(values);
        minVal = this.getMin(zeroBaseValues);
        maxVal = this.getMax(zeroBaseValues);
        getHeight = this.convertRelToAbs(minVal, maxVal, this.chartHeight);

        grid = this.calculateGrid(minVal, maxVal, this.chartHeight, this.chartMarginTop);

        this.drawVLabels(this.lr, grid);
        this.removeElements(this.gridLines);
        this.gridLines = this.drawGrid(this.r, grid, this.chartWidth);

        this.updateItemsScale(vBars, getHeight);
    }

    // create horizontal labels
    this.createHLabels();
};

/** Return charts content elemtnt */
BaseChart.prototype.getContent = function () {
    return this.chartContent;
};

/** Return charts wrap element */
BaseChart.prototype.getWrapObject = function () {
    return this.chartsWrapObj;
};

/** Return minimum value from array */
BaseChart.prototype.getMin = function (arrObj) {
    if (!Array.isArray(arrObj)) {
        return null;
    }

    return Math.min.apply(null, arrObj);
};

/** Return maximum value from array */
BaseChart.prototype.getMax = function (arrObj) {
    if (!Array.isArray(arrObj)) {
        return null;
    }

    return Math.max.apply(null, arrObj);
};

/** Return function to convert relative value to absolute */
BaseChart.prototype.convertRelToAbs = function (minVal, maxVal, absMaxVal) {
    var dVal = Math.abs(maxVal - minVal);

    return function (val) {
        return absMaxVal * ((val - minVal) / dVal);
    };
};

/** Calculate grid */
BaseChart.prototype.calculateGrid = function (minValue, maxValue, height, margin) {
    var gridStepRatio;
    var getHeight;
    var dVal;
    var grid = {};

    getHeight = this.convertRelToAbs(minValue, maxValue, height);

    dVal = Math.abs(maxValue - minValue);

    // calculate vertical grid step
    grid.valueStep = 5;
    while ((dVal / grid.valueStep) > 1) {
        grid.valueStep *= 10;
    }

    gridStepRatio = Math.floor(height / 50);

    while ((dVal / grid.valueStep) < gridStepRatio) {
        grid.valueStep /= 2;
    }

    // calculate first label value
    if (maxValue > 0) {
        grid.valueFirst = maxValue - (maxValue % grid.valueStep);
    } else {
        grid.valueFirst = 0;
    }

    // calculate y of first grid line
    grid.yFirst = height - getHeight(grid.valueFirst) + margin;

    // calculate absolute grid step
    grid.steps = Math.floor(dVal / grid.valueStep);
    grid.yStep = (height - grid.yFirst + margin) / grid.steps;

    return grid;
};

/** Remove elements */
BaseChart.prototype.removeElements = function (elem) {
    var elems = Array.isArray(elem) ? elem : [elem];

    elems.forEach(function (el) {
        el.remove();
    });
};

/** Draw grid and return array of grid lines */
BaseChart.prototype.drawGrid = function (paper, grid, width) {
    var i;
    var linePath;
    var curY;
    var el;
    var lines = [];

    curY = grid.yFirst;
    for (i = 0; i <= grid.steps; i += 1) {
        linePath = 'M0,' + Math.round(curY) + '.5L' + width + ',' + Math.round(curY) + '.5';
        el = svg('path', {
            class: 'chart__grid-line',
            d: linePath
        });

        prependChild(paper, el);

        lines.push(el);

        curY += grid.yStep;
    }

    return lines;
};

/** Save total width of chart block with labels */
BaseChart.prototype.getChartOffset = function (chartElem) {
    if (
        !chartElem
        || !chartElem.parentNode
        || !chartElem.parentNode.parentNode
        || !chartElem.parentNode.parentNode.parentNode
    ) {
        return null;
    }

    return chartElem.parentNode.parentNode.parentNode.offsetWidth;
};

/** Return array of values */
BaseChart.prototype.mapValues = function (items) {
    if (!items || !Array.isArray(items)) {
        return null;
    }

    return items.map(function (item) {
        return item.value;
    });
};

/** Update width of chart block */
BaseChart.prototype.updateChartWidth = function () {
    var paperWidth;
    var chartOffset;

    if (!this.r) {
        return;
    }

    chartOffset = this.getChartOffset(this.chart);
    paperWidth = Math.max(chartOffset - this.vLabelsWidth, this.chartContentWidth);

    this.r.setAttribute('width', paperWidth);
    this.r.setAttribute('height', this.paperHeight);

    this.chartWidth = Math.max(paperWidth, this.chartContentWidth);
};

/** Set new width for vertical labels block and SVG object */
BaseChart.prototype.setVertLabelsWidth = function (width) {
    if (!this.lr || !this.chart) {
        return;
    }

    this.lr.setAttribute('width', width);
    this.lr.setAttribute('height', this.paperHeight + 20);
    this.vLabelsWidth = width;

    this.updateChartWidth();
};

/** Return array of currently visible items */
BaseChart.prototype.getVisibleItems = function () {
    var res = [];
    var itemOutWidth;
    var itemsOnWidth;
    var firstItem;
    var i;
    var offs = this.visibilityOffset;

    if (!this.chartContent) {
        return null;
    }

    itemOutWidth = this.barWidth + this.barMargin;
    itemsOnWidth = Math.round(this.chartContent.offsetWidth / itemOutWidth);
    itemsOnWidth = Math.min(this.items.length, itemsOnWidth + 2 * offs);

    firstItem = Math.floor(this.chartContent.scrollLeft / itemOutWidth);
    firstItem = Math.max(0, firstItem - offs);

    if (firstItem + itemsOnWidth >= this.items.length) {
        itemsOnWidth = this.items.length - firstItem;
    }

    for (i = 0; i < itemsOnWidth; i += 1) {
        res.push(this.items[firstItem + i]);
    }

    return res;
};

/** Draw vertical labels */
BaseChart.prototype.drawVLabels = function (paper, grid) {
    var xOffset = 5;
    var dyOffset = 5.5;
    var curY;
    var val;
    var el;
    var tspan;
    var i;

    if (!paper || !grid) {
        return;
    }

    curY = grid.yFirst;
    val = grid.valueFirst;

    this.removeElements(this.vertLabels);

    this.vertLabels = [];
    for (i = 0; i <= grid.steps; i += 1) {
        tspan = svg('tspan', { dy: dyOffset });
        tspan.innerHTML = val.toString();
        el = svg('text', {
            className: 'chart__text',
            x: xOffset,
            y: Math.round(curY)
        }, tspan);

        paper.appendChild(el);
        this.vertLabels.push(el);

        if (el.clientWidth + 10 > this.vLabelsWidth) {
            this.setVertLabelsWidth(el.clientWidth + 10);
        }

        val -= grid.valueStep;

        curY += grid.yStep;
    }
};

/** Create horizontal labels */
BaseChart.prototype.createHLabels = function () {
    var labelShift = 0;
    var lastOffset = 0;
    var lblMarginLeft = 10;
    var dyOffset = 5.5;
    var lblY = this.paperHeight - (this.hLabelsHeight / 2);

    this.data.series.forEach(function (val) {
        var txtEl;
        var tspan;
        var itemDate = val[0];
        var itemsCount = val[1];

        if (lastOffset === 0 || labelShift > lastOffset + lblMarginLeft) {
            tspan = svg('tspan', { dy: dyOffset });
            tspan.innerHTML = itemDate.toString();
            txtEl = svg('text', {
                className: 'chart__text',
                x: labelShift,
                y: lblY
            }, tspan);

            this.r.appendChild(txtEl);

            lastOffset = labelShift + txtEl.clientWidth;
        }
        labelShift += itemsCount * (this.barWidth + this.barMargin);
    }, this);
};

/** Chart item click event handler */
BaseChart.prototype.onItemClick = function (e, barRect, val) {
    if (!isFunction(this.itemClickHandler)) {
        return;
    }

    this.itemClickHandler.call(this, e, barRect, val);
};

/** Chart item mouse over event handler */
BaseChart.prototype.onItemOver = function (e, barRect) {
    if (!isFunction(this.itemOverHandler)) {
        return;
    }

    this.itemOverHandler.call(this, e, barRect);
};

/** Chart item mouse out from bar event handler */
BaseChart.prototype.onItemOut = function (e, barRect) {
    if (!isFunction(this.itemOutHandler)) {
        return;
    }

    this.itemOutHandler.call(this, e, barRect);
};

/** Chart content 'scroll' event handler */
BaseChart.prototype.onScroll = function () {
    var vItems;
    var values;
    var minVal;
    var maxVal;
    var getHeight;
    var grid;
    var zeroBaseValues;

    if (!this.autoScale) {
        return;
    }

    vItems = this.getVisibleItems();
    values = this.mapValues(vItems);

    zeroBaseValues = this.getZeroBased(values);
    minVal = this.getMin(zeroBaseValues);
    maxVal = this.getMax(zeroBaseValues);
    getHeight = this.convertRelToAbs(minVal, maxVal, this.chartHeight);

    grid = this.calculateGrid(minVal, maxVal, this.chartHeight, this.chartMarginTop);
    this.drawVLabels(this.lr, grid);
    this.removeElements(this.gridLines);
    this.gridLines = this.drawGrid(this.r, grid, this.chartWidth);

    this.updateItemsScale(vItems, getHeight);

    if (isFunction(this.scrollHandler)) {
        this.scrollHandler.call(this);
    }
};

/** Normalize array of values with conditions of chart */
BaseChart.prototype.getZeroBased = function (values) {
    return values;
};

/** Create items with default scale */
BaseChart.prototype.createItems = function () {
};

/** Update scale of items */
/* eslint-disable-next-line no-unused-vars */
BaseChart.prototype.updateItemsScale = function (itemsArr, getHeight) {
};
