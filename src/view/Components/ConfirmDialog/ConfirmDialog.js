import { isFunction, Component } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Popup } from 'jezvejs/Popup';
import { __ } from '../../utils/utils.js';

const defaultProps = {
    destroyOnResult: true,
    title: null,
    confirmButtonTitle: __('dialog.confirm'),
    cancelButtonTitle: __('dialog.reject'),
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

        const confirmButton = Button.create({
            title: this.props.confirmButtonTitle,
            className: 'submit-btn',
            onClick: () => this.onResult(true),
        });
        const cancelButton = Button.create({
            title: this.props.cancelButtonTitle,
            className: 'cancel-btn',
            onClick: () => this.onResult(false),
        });

        const popupProps = {
            title: this.props.title,
            content: this.props.content,
            footer: [
                confirmButton.elem,
                cancelButton.elem,
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

        this.show();
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
