import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
    click,
    evaluate,
    asyncMap,
    queryAll,
    prop,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { Category } from '../../../model/Category.js';
import { __ } from '../../../model/locale.js';

const fieldSelectors = {
    parentField: '.parent-field',
    typeField: '.type-field',
    subcategoriesField: '.subcategories-field',
    transactionsField: '.trans-count-field',
    createDateField: '.create-date-field',
    updateDateField: '.update-date-field',
};

/**
 * Category details test component
 */
export class CategoryDetails extends TestComponent {
    static getExpectedState(category, state = App.state) {
        assert(category, 'Invalid category');

        const parent = state.categories.getItem(category.parent_id);
        const parentTitle = (parent) ? parent.name : __('categories.noParent');
        const subcategories = state.categories.findByParent(category.id);
        const itemTransactions = state.transactions.applyFilter({
            categories: category.id,
        });

        const res = {
            title: {
                visible: true,
                value: category.name,
            },
            parentField: {
                visible: true,
                value: parentTitle,
            },
            typeField: {
                visible: true,
                value: Category.typeToString(category.type),
            },
            subcategoriesField: {
                value: subcategories.length.toString(),
                visible: !parent,
            },
            subcategoriesList: {
                visible: subcategories.length > 0,
            },
            subcategories: subcategories.map((item) => item.name),
            transactionsField: {
                value: itemTransactions.length.toString(),
                visible: true,
            },
            transactionsLink: { visible: true },
            createDateField: {
                value: App.secondsToDateString(category.createdate),
                visible: true,
            },
            updateDateField: {
                value: App.secondsToDateString(category.updatedate),
                visible: true,
            },
        };

        return res;
    }

    get loading() {
        return this.content.loading;
    }

    async parseContent() {
        const res = await evaluate((el, selectors) => {
            const textElemState = (elem) => ({
                value: elem?.textContent,
                visible: !!elem && !elem.hidden,
            });

            const trLinkEl = el.querySelector('.transactions-link');

            const state = {
                title: textElemState(el.querySelector('.heading h1')),
                loading: trLinkEl?.classList.contains('vhidden'),
                transactionsLink: {
                    visible: !!trLinkEl && !trLinkEl.hidden,
                },
            };

            Object.entries(selectors).forEach(([field, selector]) => {
                const elem = el.querySelector(selector);
                const titleEl = elem?.querySelector('.field__title');
                const contentEl = elem?.querySelector('.field__content');
                state[field] = {
                    title: titleEl?.textContent,
                    value: contentEl?.textContent,
                    visible: !!elem && !elem.hidden,
                };
            });

            return state;
        }, this.elem, fieldSelectors);

        res.closeBtn = { elem: await query(this.elem, '.close-btn') };
        res.subcategoriesList = { elem: await query(this.elem, '.subcategories-list') };

        const childElems = await queryAll(this.elem, '.subcategory-item');
        res.subcategories = await asyncMap(childElems, (el) => prop(el, 'textContent'));

        return res;
    }

    async close() {
        return click(this.content.closeBtn.elem);
    }
}
