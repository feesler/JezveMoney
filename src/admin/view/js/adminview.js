'use strict';

/* global extend, View */

/**
 * Base Admin view
 */
function AdminView() {
    AdminView.parent.constructor.apply(this, arguments);
}

extend(AdminView, View);

/**
 * Document ready event handler
 */
AdminView.prototype.onReady = function () {
    this.onStart();
};
