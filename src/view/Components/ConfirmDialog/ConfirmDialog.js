import { isFunction, Component, createElement } from 'jezvejs';
import { Popup } from 'jezvejs/Popup';
import { __ } from '../../js/utils.js';

const defaultProps = {
    destroyOnResult: true,
    title: null,
    content: null,
};

/**
 * Confirmation dialog component
 * @param {Object} props
 * @param {string} props.title - popup title
 * @param {string} props.content - confirmation message
 * @param {Function} props.onConfirm - confirmation callback function
 * @param {Function} props.onReject - reject callback function
 */
export class ConfirmDialog extends Component {
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

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        if (!isFunction(this.props.onConfirm)) {
            throw new Error('Invalid onConfirm callback');
        }

        if ('onReject' in this.props && !isFunction(this.props.onReject)) {
            throw new Error('Invalid onReject callback');
        }

        const popupProps = {
            title: this.props.title,
            content: this.props.content,
            footer: [
                createElement('button', {
                    props: {
                        className: 'btn submit-btn',
                        textContent: __('OK'),
                        type: 'button',
                    },
                    events: { click: () => this.onResult(true) },
                }),
                createElement('button', {
                    props: {
                        className: 'btn cancel-btn',
                        textContent: __('CANCEL'),
                        type: 'button',
                    },
                    events: { click: () => this.onResult(false) },
                }),
            ],
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

    /**
     * Show/hide base element of component
     */
    show(value = true) {
        this.popup.show(value);
    }

    /**
     * Show/hide base element of component
     * @param {boolean} toShow - if true component will be shown, hidden otherwise. Default is true
     */
    onResult(confirmResult) {
        this.popup.hide();
        if (this.props.destroyOnResult) {
            this.popup.destroy();
        }

        if (confirmResult) {
            this.props.onConfirm();
        } else if (isFunction(this.props.onReject)) {
            this.props.onReject();
        }
    }
}
