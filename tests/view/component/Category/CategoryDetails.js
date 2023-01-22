import {
    TestComponent,
    query,
    click,
    assert,
    evaluate,
    asyncMap,
    queryAll,
    prop,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { secondsToDateString } from '../../../common.js';
import { Category } from '../../../model/Category.js';
import { __ } from '../../../model/locale.js';

const fieldSelectors = [
    '.parent-field',
    '.type-field',
    '.subcategories-field',
    '.trans-count-field',
    '.create-date-field',
    '.update-date-field',
];

export class CategoryDetails extends TestComponent {
    get loading() {
        return this.content.loading;
    }

    async parseContent() {
        const res = {
            closeBtn: { elem: await query(this.elem, '.close-btn') },
            title: { elem: await query(this.elem, '.heading h1') },
            subcategoriesList: { elem: await query(this.elem, '.subcategories-list') },
            transactionsLink: { elem: await query(this.elem, '.transactions-link') },
        };

        const childElems = await queryAll(this.elem, '.subcategory-item');
        res.subcategories = await asyncMap(childElems, (el) => prop(el, 'textContent'));

        [
            res.title.value,
            res.loading,
        ] = await evaluate((titleEl, linkEl) => ([
            titleEl.textContent,
            linkEl.classList.contains('vhidden'),
        ]), res.title.elem, res.transactionsLink.elem);

        [
            res.parentField,
            res.typeField,
            res.subcategoriesField,
            res.transactionsField,
            res.createDateField,
            res.updateDateField,
        ] = await asyncMap(fieldSelectors, async (selector) => (
            this.parseField(await query(this.elem, selector))
        ));

        return res;
    }

    async parseField(elem) {
        assert(elem, 'Invalid field element');

        const titleElem = await query(elem, '.field__title');
        const contentElem = await query(elem, '.field__content');
        assert(titleElem && contentElem, 'Invalid structure of field');

        const res = await evaluate((titleEl, contEl) => ({
            title: titleEl.textContent,
            value: contEl.textContent,
        }), titleElem, contentElem);
        res.elem = elem;

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
                value: secondsToDateString(item.createdate),
                visible: true,
            },
            updateDateField: {
                value: secondsToDateString(item.updatedate),
                visible: true,
            },
        };

        return res;
    }
}
