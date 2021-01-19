'use strict';

/* global extend, isFunction, Component, Popup */

/**
 * Confirmation dialog component
 * @param {Object} props
 * @param {string} props.title - popup title
 * @param {string} props.content - confirmation message
 * @param {Function} props.onconfirm - confirmation callback function
 * @param {Function} props.onreject - reject callback function
 */
function ConfirmDialog() {
    var popupProps;

    ConfirmDialog.parent.constructor.apply(this, arguments);

    if (!isFunction(this.props.onconfirm)) {
        throw new Error('Invalid onconfirm callback');
    }

    if ('onreject' in this.props && !isFunction(this.props.onreject)) {
        throw new Error('Invalid onreject callback');
    }

    popupProps = {
        title: this.props.title,
        content: this.props.content,
        btn: {
            okBtn: { onclick: this.onResult.bind(this, true) },
            cancelBtn: { onclick: this.onResult.bind(this, false) }
        }
    };
    if ('id' in this.props) {
        popupProps.id = this.props.id;
    }
    if ('additional' in this.props) {
        popupProps.additional = this.props.additional;
    }

    this.popup = Popup.create(popupProps);
    if (!this.popup) {
        throw new Error('Failed to create popup');
    }
}

extend(ConfirmDialog, Component);

/** Create ConfirmDialog and show */
ConfirmDialog.create = function (props) {
    var res;

    try {
        res = new ConfirmDialog(props);
        res.show();
    } catch (e) {
        res = null;
    }

    return res;
};

/**
 * Show/hide base element of component
 */
ConfirmDialog.prototype.show = function () {
    this.popup.show();
};

/**
 * Show/hide base element of component
 * @param {boolean} toShow - if true component will be shown, hidden otherwise. Default is true
 */
ConfirmDialog.prototype.onResult = function (confirmResult) {
    this.popup.hide();
    this.popup.destroy();

    if (confirmResult) {
        this.props.onconfirm();
    } else if (isFunction(this.props.onreject)) {
        this.props.onreject();
    }
};
