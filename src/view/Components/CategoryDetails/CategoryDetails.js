import { createElement } from 'jezvejs';
import { Category } from '../../js/model/Category.js';
import { __ } from '../../js/utils.js';
import { Field } from '../Field/Field.js';
import { ItemDetails } from '../ItemDetails/ItemDetails.js';

/** CSS classes */
const PARENT_FIELD_CLASS = 'parent-field';
const TYPE_FIELD_CLASS = 'type-field';
const TR_COUNT_FIELD_CLASS = 'trans-count-field';
const VHIDDEN_CLASS = 'vhidden';

/**
 * Category details component
 */
export class CategoryDetails extends ItemDetails {
    /** Component initialization */
    getContent() {
        this.parentField = Field.create({
            title: __('CATEGORY_PARENT'),
            className: PARENT_FIELD_CLASS,
        });

        this.typeField = Field.create({
            title: __('CATEGORY_TR_TYPE'),
            className: TYPE_FIELD_CLASS,
        });

        this.transactionsField = Field.create({
            title: __('ITEM_TRANSACTIONS_COUNT'),
            className: TR_COUNT_FIELD_CLASS,
        });

        this.transactionsLink = createElement('a', {
            props: {
                className: 'transactions-link',
                textContent: __('ITEM_GO_TO_TRANSACTIONS'),
            },
        });

        return [
            this.parentField.elem,
            this.typeField.elem,
            this.transactionsField.elem,
            this.transactionsLink,
        ];
    }

    /** Returns URL to Transactions list view with filter by category */
    getTransactionsListURL(item) {
        const { baseURL } = window.app;
        const res = new URL(`${baseURL}transactions/`);
        res.searchParams.set('category_id', item.id);
        return res;
    }

    /**
     * Render specified state
     * @param {object} state - current state object
     */
    render(state) {
        if (!state?.item) {
            throw new Error('Invalid state');
        }

        const { item } = state;

        // Title
        this.heading.setTitle(item.name);

        // Parent category
        const { categories } = window.app.model;
        const parent = categories.getItem(item.parent_id);
        const parentTitle = (parent) ? parent.name : __('CATEGORY_NO_PARENT');
        this.parentField.setContent(parentTitle);

        // Transaction type
        this.typeField.setContent(Category.getTypeTitle(item.type));

        // Transactions count
        const trCountLoaded = (typeof item.transactionsCount === 'number');
        const trCount = (trCountLoaded) ? item.transactionsCount.toString() : __('LOADING');
        this.transactionsField.setContent(trCount);

        // Navigate to transactions list link
        this.transactionsLink.href = this.getTransactionsListURL(item);
        this.transactionsLink.classList.toggle(VHIDDEN_CLASS, !trCountLoaded);

        // Create and update dates
        this.renderDateField(this.createDateField, item.createdate);
        this.renderDateField(this.updateDateField, item.updatedate);
    }
}
