'use strict';

/* global extend, View, Histogram */

/**
 * Main view
 */
function MainView() {
    MainView.parent.constructor.apply(this, arguments);

    this.model = {};
}

extend(MainView, View);

/**
 * View initialization
 */
MainView.prototype.onStart = function () {
    Histogram.create({
        elem: 'chart',
        data: this.props.chartData,
        height: 200
    });
};
