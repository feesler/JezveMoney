import { isFunction } from '@jezvejs/types';
import { Component } from 'jezvejs';

import { __ } from '../../../utils/utils.js';

import { ConfirmDialog } from '../../Common/ConfirmDialog/ConfirmDialog.js';
import { Field } from '../../Common/Field/Field.js';
import { CategorySelect } from '../CategorySelect/CategorySelect.js';

import './SetCategoryDialog.scss';

const defaultProps = {
    categoryId: 0,
    type: 0,
    onChange: null,
    onSubmit: null,
    onCancel: null,
};

export class SetCategoryDialog extends Component {
    constructor(...args) {
        super(...args);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
            ...this.props,
        };

        this.init();
    }

    init() {
        this.categorySelect = CategorySelect.create({
            className: 'dd_fullwidth',
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onChange: (category) => this.onChangeCategory(category),
        });
        this.categoryField = Field.create({
            title: __('transactions.category'),
            content: this.categorySelect.elem,
            className: 'form-row',
        });

        this.dialog = ConfirmDialog.create({
            id: 'selectCategoryDialog',
            title: __('transactions.setCategory'),
            content: this.categoryField.elem,
            confirmButtonTitle: __('actions.save'),
            className: 'category-dialog',
            destroyOnResult: false,
            onConfirm: () => this.onSubmit(),
            onReject: () => this.onCancel(),
        });
        if (!this.dialog) {
            throw new Error('Failed to create dialog');
        }

        this.elem = this.dialog.elem;
    }

    /** Reset dialog state */
    reset() {
        this.setState({
            ...this.state,
            categoryId: 0,
            type: 0,
        });
    }

    /**
     * Shows/hides dialog
     */
    show(value = true) {
        this.dialog.show(value);
    }

    setCategory(category) {
        this.setState({ ...this.state, categoryId: category });
    }

    onChangeCategory(category) {
        this.setCategory(category.id);

        if (isFunction(this.props.onChange)) {
            this.props.onChange(category);
        }
    }

    onSubmit() {
        if (isFunction(this.props.onSubmit)) {
            this.props.onSubmit();
        }
    }

    onCancel() {
        if (isFunction(this.props.onCancel)) {
            this.props.onCancel();
        }
    }

    /** Renders component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (!this.categorySelect) {
            return;
        }

        this.categorySelect.setType(state.type);
        this.categorySelect.setSelection(state.categoryId);
    }
}
