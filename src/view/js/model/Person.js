'use strict';

/* global extend, ListItem */
/* eslint no-bitwise: "off" */

/** Person flags */
var PERSON_HIDDEN = 1;

/**
 * @constructor Person class
 * @param {*} props
 */
function Person() {
    Person.parent.constructor.apply(this, arguments);
}

extend(Person, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
Person.prototype.isAvailField = function (field) {
    var availFields = ['id', 'name', 'flags', 'accounts'];

    return typeof field === 'string' && availFields.includes(field);
};

/**
 * Check person is not hidden
 */
Person.prototype.isVisible = function () {
    if (!('flags' in this)) {
        throw new Error('Invalid person');
    }

    return (this.flags & PERSON_HIDDEN) === 0;
};
