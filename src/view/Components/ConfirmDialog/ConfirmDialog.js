import { isFunction } from '../../js/lib/common.js';
import { Component } from '../../js/lib/Component.js';
import { Popup } from '../../js/lib/Component.js';

/**
 * Confirmation dialog component
 * @param {Object} props
 * @param {string} props.title - popup title
 * @param {string} props.content - confirmation message
 * @param {Function} props.onconfirm - confirmation callback function
 * @param {Function} props.onreject - reject callback function
 */
export class ConfirmDialog extends Component {
    constructor(...args) {
        super(...args);

        if (!isFunction(this.props.onconfirm)) {
            throw new Error('Invalid onconfirm callback');
        }

        if ('onreject' in this.props && !isFunction(this.props.onreject)) {
            throw new Error('Invalid onreject callback');
        }

        const popupProps = {
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

    /** Create ConfirmDialog and show */
    static create(props) {
        var res;

        try {
            res = new ConfirmDialog(props);
            res.show();
        } catch (e) {
            res = null;
        }

        return res;
    }

    /**
     * Show/hide base element of component
     */
    show() {
        this.popup.show();
    }

    /**
     * Show/hide base element of component
     * @param {boolean} toShow - if true component will be shown, hidden otherwise. Default is true
     */
    onResult(confirmResult) {
        this.popup.hide();
        this.popup.destroy();

        if (confirmResult) {
            this.props.onconfirm();
        } else if (isFunction(this.props.onreject)) {
            this.props.onreject();
        }
    }
}
