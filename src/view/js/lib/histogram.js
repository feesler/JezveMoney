'use strict';

/* global svg, isFunction, extend, BaseChart */
/* exported Histogram */

/**
 * Base chart component constructor
 * @param {Object} props
 * @param {string|Element} props.elem - base element for component
 */
function Histogram() {
    this.visibilityOffset = 1;

    Histogram.parent.constructor.apply(this, arguments);
}

extend(Histogram, BaseChart);

/** Global Charts object public methods */
Histogram.create = function (props) {
    try {
        return new Histogram(props);
    } catch (e) {
        return null;
    }
};

/** Normalize array of values with conditions of chart */
Histogram.prototype.getZeroBased = function (values) {
    if (!Array.isArray(values)) {
        throw new Error('Invalid values. Array expected');
    }

    return values.concat(0);
};

/** Create items with default scale */
Histogram.prototype.createItems = function () {
    var leftPos = 0;
    var minVal;
    var maxVal;
    var getHeight;
    var zeroBaseValues;
    var zeroOffset;

    zeroBaseValues = this.getZeroBased(this.data.values);
    minVal = this.getMin(zeroBaseValues);
    maxVal = this.getMax(zeroBaseValues);
    getHeight = this.convertRelToAbs(minVal, maxVal, this.chartHeight);

    if (minVal < 0 && maxVal > 0) {
        // both positive and negative values
        zeroOffset = getHeight(0);
    } else if (minVal >= 0 && maxVal > 0) {
        // only positive values
        zeroOffset = getHeight(minVal);
    } else if (minVal < 0 && maxVal <= 0) {
        // only negative values
        zeroOffset = getHeight(maxVal);
    }

    this.items = [];
    this.data.values.forEach(function (val) {
        var barAbsVal = getHeight(val);
        var barHeight = Math.abs(barAbsVal - zeroOffset);
        var y = this.chartHeight + this.chartMarginTop - Math.max(barAbsVal, zeroOffset);

        var item = {
            value: val
        };

        item.bgRect = svg('rect', {
            x: leftPos,
            y: this.chartMarginTop,
            width: this.barWidth,
            height: this.chartHeight,
            fill: '#00bfff',
            'fill-opacity': 0,
            stroke: 'none'
        });
        this.r.appendChild(item.bgRect);

        item.rect = svg('rect', {
            x: leftPos,
            y: y,
            width: this.barWidth,
            height: barHeight,
            fill: '#00bfff',
            'fill-opacity': 1,
            stroke: 'none'
        });
        this.r.appendChild(item.rect);

        function clickHandler(e) {
            this.onItemClick.call(this, e, item.rect, val);
        }

        function mouseOverHandler(e) {
            this.onItemOver.call(this, e, item.rect);
        }

        function mouseOutHandler(e) {
            this.onItemOut.call(this, e, item.rect);
        }

        item.bgRect.addEventListener('mouseover', mouseOverHandler.bind(this));
        item.bgRect.addEventListener('mouseout', mouseOutHandler.bind(this));
        item.bgRect.addEventListener('click', clickHandler.bind(this));

        item.rect.addEventListener('mouseover', mouseOverHandler.bind(this));
        item.rect.addEventListener('mouseout', mouseOutHandler.bind(this));
        item.rect.addEventListener('click', clickHandler.bind(this));

        this.items.push(item);

        leftPos += this.barWidth + this.barMargin;
    }, this);
};

/** Update scale of items */
Histogram.prototype.updateItemsScale = function (items, getHeight) {
    var barValues;
    var zeroBaseValues;
    var minVal;
    var maxVal;
    var zeroOffset;

    if (!Array.isArray(items) || !isFunction(getHeight)) {
        return;
    }

    barValues = this.mapValues(items);

    zeroBaseValues = this.getZeroBased(barValues);
    minVal = this.getMin(zeroBaseValues);
    maxVal = this.getMax(zeroBaseValues);
    if (minVal < 0 && maxVal > 0) { // both positive and negative values
        zeroOffset = getHeight(0);
    } else if (minVal >= 0 && maxVal > 0) { // only positive values
        zeroOffset = getHeight(minVal);
    } else if (minVal < 0 && maxVal <= 0) { // only negative values
        zeroOffset = getHeight(maxVal);
    }

    // update height of bars
    items.forEach(function (item) {
        var barAbsVal = getHeight(item.value);
        var barHeight = Math.abs(barAbsVal - zeroOffset);
        var newY = this.chartHeight + this.chartMarginTop - Math.max(barAbsVal, zeroOffset);

        item.rect.setAttribute('y', newY);
        item.rect.setAttribute('height', barHeight);
    }, this);
};
