import { isFunction, Component } from 'jezvejs';
import { Popup } from 'jezvejs/Popup';

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
                okBtn: { value: 'Ok', onclick: () => this.onResult(true) },
                cancelBtn: { value: 'Cancel', onclick: () => this.onResult(false) },
            },
        };
        if ('id' in this.props) {
            popupProps.id = this.props.id;
        }
        if ('className' in this.props) {
            popupProps.className = this.props.className;
        }

        this.popup = Popup.create(popupProps);
        if (!this.popup) {
            throw new Error('Failed to create popup');
        }
    }

    /** Create ConfirmDialog and show */
    static create(props) {
        let res;

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
