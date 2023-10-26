import { getClassName } from '@jezvejs/dom';
import { DropDown } from 'jezvejs/DropDown';

import { App } from '../../../../Application/App.js';
import { __ } from '../../../../utils/utils.js';

import './FilterSelect.scss';

/* CSS classes */
const SELECT_CLASS = 'filter-select';
const CATEGORY_GROUP_CLASS = 'category-group';

/**
 * Combined accounts, persons and categories DropDown component
 */
export class FilterSelect extends DropDown {
    constructor(props = {}) {
        super({
            ...props,
            className: getClassName(SELECT_CLASS, props.className),
        });

        this.initAccounts();
        this.initPersons();
        this.initCategories();
    }

    initAccounts() {
        App.appendAccounts(this, {
            visible: true,
            idPrefix: 'a',
            group: __('accounts.listTitle'),
        });
        App.appendAccounts(this, {
            visible: false,
            idPrefix: 'a',
            group: __('accounts.hiddenListTitle'),
        });
    }

    initPersons() {
        App.appendPersons(this, {
            visible: true,
            idPrefix: 'p',
            group: __('persons.listTitle'),
        });
        App.appendPersons(this, {
            visible: false,
            idPrefix: 'p',
            group: __('persons.hiddenListTitle'),
        });
    }

    initCategories() {
        const { categories } = App.model;
        const idPrefix = 'c';
        const items = [
            {
                id: 'categoriesGroup',
                title: __('categories.listTitle'),
                type: 'group',
                items: [
                    { id: `${idPrefix}0`, title: __('categories.noCategory') },
                ],
            },
        ];

        categories.forEach((category) => {
            if (category.parent_id !== 0) {
                return;
            }

            items.push({ id: `${idPrefix}${category.id}`, title: category.name });

            // Search for children categories
            const children = categories.findByParent(category.id);
            if (children.length === 0) {
                return;
            }

            const group = `group_${category.id}`;
            items.push({
                id: group,
                type: 'group',
                title: category.name,
                className: CATEGORY_GROUP_CLASS,
                items: children.map((item) => (
                    { id: `${idPrefix}${item.id}`, title: item.name, group }
                )),
            });
        });

        this.append(items);
    }
}
