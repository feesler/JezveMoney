'use strict';

/* global svg, extend, BaseChart */
/* exported Histogram */

/**
 * Base chart component constructor
 * @param {Object} props
 * @param {string|Element} props.elem - base element for component
 */
function Histogram() {
    this.visibilityOffset = 1;
    this.scaleAroundAxis = true;

    Histogram.parent.constructor.apply(this, arguments);
}

extend(Histogram, BaseChart);

/** Global Charts object public methods */
Histogram.create = function (props) {
    return new Histogram(props);
};

/** Create items with default scale */
Histogram.prototype.createItems = function () {
    var y0 = this.grid.getY(0);

    this.items = this.data.values.map(function (val, index) {
        var leftPos = index * (this.barWidth + this.barMargin);
        var y1 = this.grid.getY(val);
        var barHeight = Math.abs(y0 - y1);
        var y = Math.min(y0, y1);

        var item = {
            value: val
        };

        item.elem = svg('rect', {
            class: 'histogram__bar',
            x: leftPos,
            y: y,
            width: this.barWidth,
            height: barHeight
        });
        this.container.appendChild(item.elem);

        return item;
    }, this);
};

/** Update scale of items */
Histogram.prototype.updateItemsScale = function (items) {
    var y0;

    if (!Array.isArray(items)) {
        return;
    }

    y0 = this.grid.getY(0);
    items.forEach(function (item) {
        var y1 = this.grid.getY(item.value);
        var newY = Math.min(y0, y1);
        var barHeight = Math.abs(y0 - y1);

        item.elem.setAttribute('y', newY);
        item.elem.setAttribute('height', barHeight);
    }, this);
};
