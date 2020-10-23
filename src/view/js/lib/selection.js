'use strict';

/* global childCount */
/* exported Selection */
/* eslint-disable no-redeclare */

/** Selection class constructor */
function Selection() {
    this.selected = {};

    this.isSelected = function (id) {
        return (id in this.selected);
    };

    this.select = function (id, obj) {
        if (!id || this.isSelected(id)) {
            return false;
        }

        this.selected[id] = obj;

        return true;
    };

    this.deselect = function (id) {
        if (!id || !this.isSelected(id)) {
            return false;
        }

        delete this.selected[id];

        return true;
    };

    this.count = function () {
        return childCount(this.selected);
    };

    this.getIdArray = function () {
        return Object.keys(this.selected);
    };

    this.clear = function () {
        this.selected = {};
    };
}
