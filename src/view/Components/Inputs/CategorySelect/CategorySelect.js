import { asArray } from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { __ } from '../../../utils/utils.js';
import { App } from '../../../Application/App.js';

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
        });

        this.elem.classList.add('dd_offset-group');

        this.state = {
            ...this.state,
            transactionType: this.props.transactionType,
            parentCategorySelect: this.props.parentCategorySelect,
            exclude: this.props.exclude,
        };

        this.initCategories();
    }

    initCategories() {
        const { categories } = App.model;
        const { transactionType, parentCategorySelect } = this.state;

        this.removeAll();

        const noCategoryTitle = (parentCategorySelect) ? 'categories.noParent' : 'categories.noCategory';
        this.addItem({ id: 0, title: __(noCategoryTitle) });

        const excludeIds = asArray(this.state.exclude).map((id) => parseInt(id, 10));

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

            this.addItem({ id: category.id, title: category.name });

            if (parentCategorySelect) {
                return;
            }

            // Search for children categories
            const children = categories.findByParent(category.id);
            if (children.length === 0) {
                return;
            }
            const group = this.addGroup();
            const groupItems = children.map((item) => (
                { id: item.id, title: item.name, group }
            ));
            this.append(groupItems);
        });
    }

    setType(transactionType) {
        if (this.state.transactionType === transactionType) {
            return;
        }

        this.setState({
            ...this.state,
            transactionType,
        });

        this.initCategories();
    }
}
