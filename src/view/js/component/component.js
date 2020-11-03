'use strict';

/* global ge, show */

/**
 * Base component constructor
 * @param {Object} props
 * @param {string|Element} props.elem - base element for component
 */
function Component(props) {
    if (typeof props === 'undefined') {
        this.props = {};
    } else {
        this.props = props;
    }

    if (this.props.parent) {
        this.parent = this.props.parent;
    }

    if (typeof this.props.elem === 'string') {
        this.elem = ge(this.props.elem);
    } else {
        this.elem = this.props.elem;
    }
}

/**
 * Parse DOM to obtain child elements and build state of component
 */
Component.prototype.parse = function () { };

/**
 * Render component state
 */
Component.prototype.render = function () { };

/**
 * Show/hide base element of component
 * @param {boolean} val - if true component will be shown, hidden otherwise. Default is true
 */
Component.prototype.show = function (val) {
    var toShow = (typeof val === 'undefined') ? true : !!val;

    if (this.elem) {
        show(this.elem, toShow);
    }
};

/**
 * Hide base element of component
 */
Component.prototype.hide = function () {
    this.show(false);
};
