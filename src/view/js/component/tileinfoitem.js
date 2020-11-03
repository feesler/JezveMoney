'use strict';

/* global isFunction, extend, Component */

/**
 * TileInfoItem component constructor
 * @param {Object} props
 */
function TileInfoItem() {
    TileInfoItem.parent.constructor.apply(this, arguments);
}

extend(TileInfoItem, Component);

/**
 * Create new TileInfoItem from specified element
 */
TileInfoItem.fromElement = function (props) {
    var res;

    try {
        res = new TileInfoItem(props);
        res.parse();
    } catch (e) {
        res = null;
    }

    return res;
};

/**
 * Parse DOM to obtain child elements and build state of component
 */
TileInfoItem.prototype.parse = function () {
    if (!(this.elem instanceof Element)) {
        throw new Error('Invalid element specified');
    }

    this.buttonElem = this.elem.querySelector('button');
    if (this.buttonElem && isFunction(this.props.onclick)) {
        this.buttonElem.addEventListener('click', this.props.onclick);
    }

    this.titleElem = this.buttonElem.querySelector('span');
    if (this.titleElem) {
        this.title = this.titleElem.textContent;
    }
};

/**
 * Set title of component
 * @param {string|null} title - title to set
 */
TileInfoItem.prototype.setTitle = function (title) {
    if (typeof title !== 'string') {
        throw new Error('Invalid title specified');
    }

    if (this.title === title) {
        return;
    }

    this.title = title;
    this.titleElem.textContent = this.title;
};