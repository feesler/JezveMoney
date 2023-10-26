import { asArray } from '@jezvejs/types';
import { getClassName } from '@jezvejs/dom';
import { DropDown } from 'jezvejs/DropDown';

import { __ } from '../../../utils/utils.js';
import { App } from '../../../Application/App.js';

import { actions, reducer } from './reducer.js';
import './CategorySelect.scss';

const CATEGORY_SELECT_CLASS = 'category-select';

const defaultProps = {
    transactionType: null, // filter categories by type, null - show all
    parentCategorySelect: false,
    exclude: null, // id or array of category ids to exclude from list
};

/**
 * Category DropDown component
 */
export class CategorySelect extends DropDown {
    static userProps = {
        selectElem: ['id', 'name', 'form'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            reducers: reducer,
            className: getClassName(CATEGORY_SELECT_CLASS, props.className),
        });

        this.initCategories();
    }

    getInitialState() {
        const res = super.getInitialState();

        res.transactionType = this.props.transactionType;
        res.parentCategorySelect = this.props.parentCategorySelect;
        res.exclude = this.props.exclude;

        return res;
    }

    initCategories() {
        const { categories } = App.model;
        const state = this.store.getState();
        const { transactionType, parentCategorySelect } = state;

        const noCategoryTitle = (parentCategorySelect) ? 'categories.noParent' : 'categories.noCategory';
        const items = [
            { id: 0, title: __(noCategoryTitle) },
        ];

        const excludeIds = asArray(state.exclude).map((id) => parseInt(id, 10));

        categories.forEach((category) => {
            if (category.parent_id !== 0 || excludeIds.includes(category.id)) {
                return;
            }
            if (
                category.type !== 0
                && transactionType !== null
                && category.type !== transactionType
            ) {
                return;
            }

            items.push({ id: category.id, title: category.name });

            if (parentCategorySelect) {
                return;
            }

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
                items: children.map((item) => (
                    { id: item.id, title: item.name, group }
                )),
            });
        });

        this.removeAll();
        this.append(items);
    }

    setType(transactionType) {
        if (this.state.transactionType === transactionType) {
            return;
        }

        this.store.dispatch(actions.setTrasactionType(transactionType));

        this.initCategories();
    }
}
