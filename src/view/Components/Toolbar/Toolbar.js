'use strict';

/* global isFunction, extend, Component, IconLink */

/**
 * Toolbar component constructor
 * @param {Object} props
 */
function Toolbar() {
    Toolbar.parent.constructor.apply(this, arguments);

    if (isFunction(this.props.onshow)) {
        this.onShowHandler = this.props.onshow;
    }
    if (isFunction(this.props.onhide)) {
        this.onHideHandler = this.props.onhide;
    }
    if (isFunction(this.props.ondelete)) {
        this.onDeleteHandler = this.props.ondelete;
    }
}

extend(Toolbar, Component);

/**
 * Create new Toolbar from specified element
 */
Toolbar.create = function (props) {
    var res;

    try {
        res = new Toolbar(props);
        res.parse();
    } catch (e) {
        res = null;
    }

    return res;
};

/**
 * Parse DOM to obtain child elements and build state of component
 */
Toolbar.prototype.parse = function () {
    if (!(this.elem instanceof Element)) {
        throw new Error('Invalid element specified');
    }

    this.elem.addEventListener('click', this.onClick.bind(this));

    this.updateBtn = IconLink.fromElement({ elem: 'edit_btn' });
    this.exportBtn = IconLink.fromElement({ elem: 'export_btn' });
    this.showBtn = IconLink.fromElement({
        elem: 'show_btn',
        onclick: this.onShowClick.bind(this)
    });
    this.hideBtn = IconLink.fromElement({
        elem: 'hide_btn',
        onclick: this.onHideClick.bind(this)
    });
    this.deleteBtn = IconLink.fromElement({
        elem: 'del_btn',
        onclick: this.onDeleteClick.bind(this)
    });
};

/**
 * Toolbar 'click' event handler
 */
Toolbar.prototype.onClick = function () {
    this.elem.classList.toggle('sidebar_active');
};

/**
 * Show button 'click' event handler
 */
Toolbar.prototype.onShowClick = function () {
    if (isFunction(this.onShowHandler)) {
        this.onShowHandler();
    }
};

/**
 * Hide button 'click' event handler
 */
Toolbar.prototype.onHideClick = function () {
    if (isFunction(this.onHideHandler)) {
        this.onHideHandler();
    }
};

/**
 * Delete button 'click' event handler
 */
Toolbar.prototype.onDeleteClick = function () {
    if (isFunction(this.onDeleteHandler)) {
        this.onDeleteHandler();
    }
};
