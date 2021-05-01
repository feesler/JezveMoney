'use strict';

/* global extend, ListItem */

/**
 * @constructor Icon class
 * @param {*} props
 */
function Icon() {
    Icon.parent.constructor.apply(this, arguments);
}

extend(Icon, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
Icon.prototype.isAvailField = function (field) {
    var availFields = ['id', 'name', 'file', 'type'];

    return typeof field === 'string' && availFields.includes(field);
};
