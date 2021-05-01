'use strict';

/* global extend, List, Icon */

/**
 * @constructor IconList class
 * @param {object[]} props - array of icons
 */
function IconList() {
    IconList.parent.constructor.apply(this, arguments);
}

extend(IconList, List);

/** Static alias for IconList constructor */
IconList.create = function (props) {
    return new IconList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
IconList.prototype.createItem = function (obj) {
    return new Icon(obj);
};
