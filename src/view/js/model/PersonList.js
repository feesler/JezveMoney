'use strict';

/* global extend, List, Person */

/**
 * @constructor PersonList class
 * @param {object[]} props - array of persons
 */
function PersonList() {
    PersonList.parent.constructor.apply(this, arguments);
}

extend(PersonList, List);

/** Static alias for PersonList constructor */
PersonList.create = function (props) {
    return new PersonList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
PersonList.prototype.createItem = function (obj) {
    return new Person(obj);
};

/**
 * Return list of visible Persons
 */
PersonList.prototype.getVisible = function () {
    return this.filter(function (item) {
        return item && item.isVisible();
    });
};
