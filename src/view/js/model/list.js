'use strict';

/* global isObject, copyObject */

/**
 * @constructor Base List class
 * @param {object[]} props - array of list items
 */
function List(props) {
    var data;

    if (props instanceof List) {
        data = props.data;
    } else {
        data = Array.isArray(props) ? props : [];
    }

    this.setData(data);
}

/** Static alias for List constructor */
List.create = function (props) {
    return new List(props);
};

/**
 * Assign new data to the list
 * @param {Array} data - array of list items
 */
List.prototype.setData = function (data) {
    var newData;

    if (!Array.isArray(data)) {
        throw new Error('Invalid list props');
    }

    newData = copyObject(data);
    this.data = newData.map(this.createItem.bind(this));
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
List.prototype.createItem = function (obj) {
    return obj;
};

/**
 * Add new item to the list
 * @param {Object} obj - object to create new item from
 */
List.prototype.addItem = function (obj) {
    this.data.push(this.createItem(obj));
};

/**
 * Return item with specified id
 * @param {Number} itemId - identifier of item to find
 */
List.prototype.getItem = function (itemId) {
    var id = parseInt(itemId, 10);
    if (!id) {
        return null;
    }

    return this.data.find(function (item) {
        return item && item.id === id;
    });
};

/**
 * Return index of item with specified id
 * Return -1 in case item can't be found
 * @param {Number} itemId - identifier of item to find
 */
List.prototype.getItemIndex = function (itemId) {
    var id = parseInt(itemId, 10);
    if (!id) {
        return null;
    }

    return this.data.findIndex(function (item) {
        return item && item.id === id;
    });
};

/**
 * Return item by specified index
 * Return null in case item can't be found
 * @param {Number} index - index of item to return
 */
List.prototype.getItemByIndex = function (index) {
    var ind = parseInt(index, 10);
    if (Number.isNaN(ind) || ind < 0 || ind >= this.data.length) {
        return null;
    }

    return this.data[ind];
};

/**
 * @constructor ListItem
 * @param {object} props - properties of list item object
 */
function ListItem(props) {
    var keys;

    if (!isObject(props)) {
        throw new Error('Invalid list item props');
    }

    keys = Object.keys(props);
    keys.forEach(function (prop) {
        if (this.isAvailField(prop)) {
            this[prop] = props[prop];
        }
    }, this);
}

/** Static alias for ListItem constructor */
ListItem.create = function (props) {
    return new ListItem(props);
};

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
ListItem.prototype.isAvailField = function (field) {
    return (typeof field === 'string');
};
