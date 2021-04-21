'use strict';

/* global ce, svg, isFunction, getOffset, extend, Component, ChartGrid */
/* exported BaseChart */

/**
 * Base chart component constructor
 * @param {Object} props
 * @param {string|Element} props.elem - base element for component
 */
function BaseChart() {
    BaseChart.parent.constructor.apply(this, arguments);

    if (
        !this.elem
        || !this.props
        || !this.props.data
        || !this.props.data.values
        || !this.props.data.series
    ) {
        throw new Error('Invalid chart properties');
    }

    this.chartsWrapObj = null;
    this.chart = null;
    this.chartContent = null;
    this.verticalLabels = null;
    this.container = null;
    this.labelsContainer = null;
    this.paperHeight = 300;
    this.hLabelsHeight = 25;
    this.vLabelsWidth = 10;
    this.chartMarginTop = 10;
    this.barMargin = 10;
    this.barWidth = 0;
    this.chartWidth = 0;
    this.chartHeight = 0;
    this.lastHLabelOffset = 0;
    this.chartContentWidth = 0;
    this.gridValuesMargin = 0.1;
    this.minGridStep = 30;
    this.maxGridStep = 60;
    if (!('visibilityOffset' in this)) {
        this.visibilityOffset = 1;
    }
    if (!('scaleAroundAxis' in this)) {
        this.scaleAroundAxis = true;
    }
    this.data = {};
    this.items = [];
    this.grid = null;
    this.gridLines = [];
    this.vertLabels = [];
    this.fitToWidth = false;
    this.autoScale = false;
    this.itemClickHandler = null;
    this.scrollHandler = null;
    this.itemOverHandler = null;
    this.itemOutHandler = null;

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

    this.init();
}

extend(BaseChart, Component);

/** Initialization of chart */
BaseChart.prototype.init = function () {
    var events = {};

    this.verticalLabels = ce('div');
    this.chart = ce('div');
    this.chartContent = ce(
        'div',
        { className: 'chart_content' },
        this.chart,
        { scroll: this.onScroll.bind(this) }
    );

    this.chartsWrapObj = ce('div', { className: 'charts' }, [
        ce('div', { className: 'chart_wrap' }, this.chartContent),
        ce('div', { className: 'vertical-legend' }, this.verticalLabels)
    ]);
    this.elem.appendChild(this.chartsWrapObj);

    this.chartHeight = this.paperHeight - this.hLabelsHeight - this.chartMarginTop;
    this.barWidth = 38;

    this.labelsContainer = svg('svg', { width: this.vLabelsWidth, height: this.paperHeight + 20 });
    this.verticalLabels.appendChild(this.labelsContainer);

    // create grid
    this.calculateGrid(this.data.values);

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

    if (isFunction(this.itemOverHandler) || isFunction(this.itemOutHandler)) {
        events.mousemove = this.onItemOver.bind(this);
        events.mouseout = this.onItemOut.bind(this);
    }
    if (isFunction(this.itemClickHandler)) {
        events.click = this.onItemClick.bind(this);
    }

    this.container = svg(
        'svg',
        { width: this.chartWidth, height: this.paperHeight },
        null,
        events
    );

    this.chart.appendChild(this.container);

    this.containerOffset = getOffset(this.container);

    this.drawVLabels();

    // create bars
    this.createItems();
    this.scaleVisible();

    // create horizontal labels
    this.createHLabels();
    this.updateChartWidth();

    this.drawGrid();
};

/** Return charts content elemtnt */
BaseChart.prototype.getContent = function () {
    return this.chartContent;
};

/** Return charts wrap element */
BaseChart.prototype.getWrapObject = function () {
    return this.chartsWrapObj;
};

/**
 * Calculate grid for specified set of values
 * @param {number[]} values
 */
BaseChart.prototype.calculateGrid = function (values) {
    var grid;

    grid = new ChartGrid({
        scaleAroundAxis: this.scaleAroundAxis,
        height: this.chartHeight,
        margin: this.chartMarginTop,
        minStep: this.minGridStep,
        maxStep: this.maxGridStep,
        valuesMargin: this.gridValuesMargin
    });

    grid.calculate(values);

    this.grid = grid;
};

/** Remove elements */
BaseChart.prototype.removeElements = function (elem) {
    var elems = Array.isArray(elem) ? elem : [elem];

    elems.forEach(function (el) {
        el.remove();
    });
};

/** Draw grid and return array of grid lines */
BaseChart.prototype.drawGrid = function () {
    var linePath;
    var curY;
    var rY;
    var el;
    var width = this.chartWidth;
    var step = 0;
    var lines = [];

    if (!this.grid.steps) {
        return;
    }

    curY = this.grid.yFirst;
    while (step <= this.grid.steps) {
        rY = Math.round(curY);
        if (rY > curY) {
            rY -= 0.5;
        } else {
            rY += 0.5;
        }

        linePath = 'M0,' + rY + 'L' + width + ',' + rY;
        el = svg('path', {
            class: 'chart__grid-line',
            d: linePath
        });

        lines.push(el);

        curY += this.grid.yStep;
        step += 1;
    }

    this.removeElements(this.gridLines);
    this.container.prepend.apply(this.container, lines);

    this.gridLines = lines;
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

    this.chartContentWidth = (this.data.values.length) * (this.barWidth + this.barMargin);
    this.chartContentWidth = Math.max(this.chartContentWidth, this.lastHLabelOffset);

    chartOffset = this.getChartOffset(this.chart);
    paperWidth = Math.max(chartOffset - this.vLabelsWidth, this.chartContentWidth);

    this.container.setAttribute('width', paperWidth);
    this.container.setAttribute('height', this.paperHeight);

    this.chartWidth = Math.max(paperWidth, this.chartContentWidth);
};

/** Set new width for vertical labels block and SVG object */
BaseChart.prototype.setVertLabelsWidth = function (width) {
    var lWidth;

    if (!this.labelsContainer || !this.chart) {
        return;
    }

    lWidth = Math.ceil(width);
    if (this.vLabelsWidth === lWidth) {
        return;
    }

    this.labelsContainer.setAttribute('width', lWidth);
    this.labelsContainer.setAttribute('height', this.paperHeight + 20);
    this.vLabelsWidth = lWidth;

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
BaseChart.prototype.drawVLabels = function () {
    var tVal;
    var tspan;
    var prop;
    var el;
    var isZero;
    var xOffset = 5;
    var dyOffset = 5.5;
    var curY = this.grid.yFirst;
    var val = this.grid.valueFirst;
    var step = 0;
    var labelRect;
    var labelsWidth = 0;

    if (!this.grid.steps) {
        return;
    }

    this.removeElements(this.vertLabels);

    this.vertLabels = [];
    while (step <= this.grid.steps) {
        isZero = Math.abs(this.grid.toPrec(val)) === 0;
        tVal = (isZero) ? 0 : this.grid.toPrecString(val);

        tspan = svg('tspan', { dy: dyOffset });
        prop = ('innerHTML' in tspan) ? 'innerHTML' : 'textContent';
        tspan[prop] = tVal.toString();
        el = svg('text', {
            className: 'chart__text',
            x: xOffset,
            y: Math.round(curY)
        }, tspan);

        this.labelsContainer.appendChild(el);
        this.vertLabels.push(el);

        labelRect = el.getBoundingClientRect();
        labelsWidth = Math.max(labelsWidth, Math.ceil(labelRect.width) + 10);
        val -= this.grid.valueStep;
        curY += this.grid.yStep;
        step += 1;
    }

    this.setVertLabelsWidth(labelsWidth);
};

/** Create horizontal labels */
BaseChart.prototype.createHLabels = function () {
    var labelShift = 0;
    var lastOffset = 0;
    var lblMarginLeft = 10;
    var dyOffset = 5.5;
    var lblY = this.paperHeight - (this.hLabelsHeight / 2);

    this.data.series.forEach(function (val) {
        var labelRect;
        var txtEl;
        var tspan;
        var prop;
        var itemDate = val[0];
        var itemsCount = val[1];

        if (lastOffset === 0 || labelShift > lastOffset + lblMarginLeft) {
            tspan = svg('tspan', { dy: dyOffset });
            prop = ('innerHTML' in tspan) ? 'innerHTML' : 'textContent';
            tspan[prop] = itemDate.toString();
            txtEl = svg('text', {
                className: 'chart__text',
                x: labelShift,
                y: lblY
            }, tspan);

            this.container.appendChild(txtEl);

            labelRect = txtEl.getBoundingClientRect();
            lastOffset = labelShift + Math.ceil(labelRect.width);
        }
        labelShift += itemsCount * (this.barWidth + this.barMargin);
    }, this);

    this.lastHLabelOffset = lastOffset;
};

/** Find item by event object */
BaseChart.prototype.findItemByEvent = function (e) {
    var x = e.clientX - this.containerOffset.left + this.chartContent.scrollLeft;
    var index = Math.floor(x / (this.barWidth + this.barMargin));

    if (index < 0 || index >= this.items.length) {
        return null;
    }

    return this.items[index];
};

/** Chart item click event handler */
BaseChart.prototype.onItemClick = function (e) {
    var item;

    if (!isFunction(this.itemClickHandler)) {
        return;
    }
    item = this.findItemByEvent(e);
    if (!item) {
        return;
    }

    this.itemClickHandler.call(this, e, item);
};

/** Chart item mouse over event handler */
BaseChart.prototype.onItemOver = function (e) {
    var item;

    if (!isFunction(this.itemOverHandler)) {
        return;
    }
    item = this.findItemByEvent(e);
    if (this.activeItem === item) {
        return;
    }
    if (this.activeItem && isFunction(this.itemOutHandler)) {
        this.itemOutHandler.call(this, e, this.activeItem);
    }

    if (!item) {
        return;
    }

    this.activeItem = item;
    this.itemOverHandler.call(this, e, item);
};

/** Chart item mouse out from bar event handler */
BaseChart.prototype.onItemOut = function (e) {
    var item;

    if (!isFunction(this.itemOutHandler)) {
        return;
    }

    item = this.activeItem;
    this.activeItem = null;

    if (!item) {
        return;
    }
    this.itemOutHandler.call(this, e, item);
};

/** Scale visible items of chart */
BaseChart.prototype.scaleVisible = function () {
    var vItems;
    var values;

    if (!this.autoScale) {
        return;
    }

    vItems = this.getVisibleItems();
    values = this.mapValues(vItems);

    this.calculateGrid(values);
    this.drawVLabels();
    this.drawGrid();

    this.updateItemsScale(vItems);
};

/** Chart content 'scroll' event handler */
BaseChart.prototype.onScroll = function () {
    this.scaleVisible();

    if (isFunction(this.scrollHandler)) {
        this.scrollHandler.call(this);
    }
};

/** Create items with default scale */
BaseChart.prototype.createItems = function () {
};

/** Update scale of items */
/* eslint-disable-next-line no-unused-vars */
BaseChart.prototype.updateItemsScale = function (items) {
};
