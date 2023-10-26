import { isFunction } from '@jezvejs/types';
import { createElement } from '@jezvejs/dom';
import { Component } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { ConfirmDialog } from '../../Common/ConfirmDialog/ConfirmDialog.js';
import { __ } from '../../../utils/utils.js';
import './DeleteCategoryDialog.scss';

const MESSAGE_CLASS = 'confirm-message';

const defaultProps = {
    showChildrenCheckbox: true,
};

export class DeleteCategoryDialog extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
        };

        this.init();
    }

    init() {
        const messageElem = createElement('div', {
            props: {
                className: MESSAGE_CLASS,
                textContent: this.props.content,
            },
        });

        this.deleteChildredCheck = Checkbox.create({
            label: __('categories.deleteChildren'),
            onChange: () => this.onToggleDeleteChild(),
        });

        this.dialog = ConfirmDialog.create({
            id: this.props.id,
            title: this.props.title,
            content: [
                messageElem,
                this.deleteChildredCheck.elem,
            ],
            onConfirm: () => this.onConfirm(),
            onReject: () => this.onReject(),
        });
        if (!this.dialog) {
            throw new Error('Failed to create dialog');
        }

        this.elem = this.dialog.elem;

        this.reset();
    }

    /** Reset dialog state */
    reset() {
        this.setState({
            ...this.state,
            removeChild: true,
        });
    }

    /**
     * Shows/hides dialog
     */
    show(value = true) {
        this.dialog.show(value);
    }

    onToggleDeleteChild() {
        this.setState({
            ...this.state,
            removeChild: !this.state.removeChild,
        });
    }

    onConfirm() {
        if (isFunction(this.props.onConfirm)) {
            this.props.onConfirm(this.state.removeChild);
        }
    }

    onReject() {
        if (isFunction(this.props.onReject)) {
            this.props.onReject();
        }
    }

    /** Renders component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.deleteChildredCheck.show(state.showChildrenCheckbox);
        this.deleteChildredCheck.check(state.removeChild);
    }
}
