import { createElement } from '@jezvejs/dom';
import { Collapsible } from 'jezvejs/Collapsible';

import { __, getApplicationURL } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

import { Category } from '../../../../Models/Category.js';

import { Field } from '../../../../Components/Common/Field/Field.js';
import { ItemDetails } from '../../../../Components/Layout/ItemDetails/ItemDetails.js';

/** CSS classes */
const PARENT_FIELD_CLASS = 'parent-field';
const TYPE_FIELD_CLASS = 'type-field';
const TR_COUNT_FIELD_CLASS = 'trans-count-field inline-field';
const SUBCATEGORIES_FIELD_CLASS = 'subcategories-field inline-field';
const SUBCATEGORIES_LIST_CLASS = 'subcategories-list';
const SUBCATEGORY_ITEM_CLASS = 'subcategory-item';
const VHIDDEN_CLASS = 'vhidden';

/**
 * Category details component
 */
export class CategoryDetails extends ItemDetails {
    /** Component initialization */
    getContent() {
        this.parentField = Field.create({
            title: __('categories.parent'),
            className: PARENT_FIELD_CLASS,
        });

        this.typeField = Field.create({
            title: __('categories.transactionType'),
            className: TYPE_FIELD_CLASS,
        });

        this.subcategoriesField = Field.create({
            title: __('categories.childCount'),
            className: SUBCATEGORIES_FIELD_CLASS,
        });

        this.toggleSubcategoriesBtn = createElement('button', {
            props: {
                className: 'btn link-btn',
                type: 'button',
                textContent: __('actions.show'),
            },
        });

        this.subcategoriesList = Collapsible.create({
            className: SUBCATEGORIES_LIST_CLASS,
            animated: true,
            header: this.toggleSubcategoriesBtn,
            onStateChange: (exp) => this.onToggleSubcategories(exp),
        });

        this.transactionsField = Field.create({
            title: __('item.transactionsCount'),
            className: TR_COUNT_FIELD_CLASS,
        });

        this.transactionsLink = createElement('a', {
            props: {
                className: 'transactions-link',
                textContent: __('item.goToTransactions'),
            },
        });

        return [
            this.parentField.elem,
            this.typeField.elem,
            this.subcategoriesField.elem,
            this.subcategoriesList.elem,
            this.transactionsField.elem,
            this.transactionsLink,
        ];
    }

    /** Returns URL to Transactions list view with filter by category */
    getTransactionsListURL(item) {
        return getApplicationURL('transactions/', { categories: [item.id] });
    }

    onToggleSubcategories(expanded) {
        const title = (expanded) ? __('categories.hideChildren') : __('categories.showChildren');
        this.toggleSubcategoriesBtn.textContent = title;
    }

    renderSubcategories(item) {
        const { categories } = App.model;
        const subcategories = categories.findByParent(item.id);

        this.subcategoriesField.setContent(subcategories.length.toString());
        this.subcategoriesField.show(item.parent_id === 0);

        const content = subcategories.map((category) => (
            createElement('div', {
                props: {
                    className: SUBCATEGORY_ITEM_CLASS,
                    textContent: category.name,
                },
            })
        ));
        this.subcategoriesList.setContent(content);
        this.subcategoriesList.show(subcategories.length > 0);
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
        const { categories } = App.model;
        const parent = categories.getItem(item.parent_id);
        const parentTitle = (parent) ? parent.name : __('categories.noParent');
        this.parentField.setContent(parentTitle);

        // Transaction type
        this.typeField.setContent(Category.getTypeTitle(item.type));

        // Subcategories
        this.renderSubcategories(item);

        // Transactions count
        const trCountLoaded = (typeof item.transactionsCount === 'number');
        const trCount = (trCountLoaded) ? item.transactionsCount.toString() : __('loading');
        this.transactionsField.setContent(trCount);

        // Navigate to transactions list link
        this.transactionsLink.href = this.getTransactionsListURL(item);
        this.transactionsLink.classList.toggle(VHIDDEN_CLASS, !trCountLoaded);

        // Create and update dates
        this.renderDateField(this.createDateField, item.createdate);
        this.renderDateField(this.updateDateField, item.updatedate);
    }
}
