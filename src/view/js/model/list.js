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

/** Length getter */
Object.defineProperty(List.prototype, 'length', {
    get: function () {
        return this.data.length;
    }
});

/** Wrap method for array forEach method */
List.prototype.forEach = function () {
    this.data.forEach.apply(this.data, arguments);
};

/** Wrap method for array map() method */
List.prototype.map = function () {
    return this.data.map.apply(this.data, arguments);
};

/** Wrap method for array find() method */
List.prototype.find = function () {
    return this.data.find.apply(this.data, arguments);
};

/** Wrap method for array filter() method */
List.prototype.filter = function () {
    return this.data.filter.apply(this.data, arguments);
};

/** Wrap method for array every() method */
List.prototype.every = function () {
    return this.data.every.apply(this.data, arguments);
};

/** Wrap method for array some() method */
List.prototype.some = function () {
    return this.data.some.apply(this.data, arguments);
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
 * Replace item with same id as specified object
 * @param {Number} index - index of item to update
 */
List.prototype.updateItem = function (obj) {
    var ind;

    if (!obj || !obj.id) {
        throw new Error('Invalid item object');
    }

    ind = this.getItemIndex(obj.id);
    if (ind === null) {
        throw new Error('Item not found');
    }

    this.data[ind] = this.createItem(obj);
};

/**
 * Replace item at specified index with new item
 * @param {Number} index - index of item to update
 * @param {Object} obj - index of item to update
 */
List.prototype.updateItemByIndex = function (index, obj) {
    var ind = parseInt(index, 10);
    if (Number.isNaN(ind) || ind < 0 || ind >= this.data.length) {
        throw new Error('Invalid item index');
    }
    if (!obj) {
        throw new Error('Invalid item object');
    }

    this.data[ind] = this.createItem(obj);
};

/**
 * Remove item by id
 * @param {Number} itemId - id item to remove
 */
List.prototype.deleteItem = function (itemId) {
    var ind = this.getItemIndex(itemId);
    if (ind === null) {
        throw new Error('Item not found');
    }

    this.deleteItemByIndex(ind);
};

/**
 * Remove item at specified index
 * @param {Number} index - index of item to remove
 */
List.prototype.deleteItemByIndex = function (index) {
    var ind = parseInt(index, 10);
    if (Number.isNaN(ind) || ind < 0 || ind >= this.data.length) {
        throw new Error('Invalid item index');
    }

    this.data.splice(ind, 1);
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
