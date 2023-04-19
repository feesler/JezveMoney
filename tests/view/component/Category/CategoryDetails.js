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
import { secondsToDateString } from '../../../common.js';
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

export class CategoryDetails extends TestComponent {
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

    static render(item, state) {
        const parent = state.categories.getItem(item.parent_id);
        const parentTitle = (parent) ? parent.name : __('CATEGORY_NO_PARENT', App.view.locale);

        const subcategories = state.categories.findByParent(item.id);

        const itemTransactions = state.transactions.applyFilter({
            categories: item.id,
        });
        const dateLocale = App.state.getDateFormatLocale();

        const res = {
            title: {
                visible: true,
                value: item.name,
            },
            parentField: {
                visible: true,
                value: parentTitle,
            },
            typeField: {
                visible: true,
                value: Category.typeToString(item.type, App.view.locale),
            },
            subcategoriesField: {
                value: subcategories.length.toString(),
                visible: !parent,
            },
            subcategoriesList: {
                visible: subcategories.length > 0,
            },
            subcategories: subcategories.map((category) => category.name),
            transactionsField: {
                value: itemTransactions.length.toString(),
                visible: true,
            },
            transactionsLink: { visible: true },
            createDateField: {
                value: secondsToDateString(item.createdate, dateLocale, App.dateFormatOptions),
                visible: true,
            },
            updateDateField: {
                value: secondsToDateString(item.updatedate, dateLocale, App.dateFormatOptions),
                visible: true,
            },
        };

        return res;
    }
}
