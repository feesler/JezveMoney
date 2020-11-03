'use strict';

/* global extend, View, Charts */

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
    Charts.createHistogram({
        data: this.props.chartData,
        container: 'chart',
        height: 200
    });
};
