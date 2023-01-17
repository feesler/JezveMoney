import { DropDown } from 'jezvejs/DropDown';
import { __ } from '../../js/utils.js';

const defaultProps = {
    transactionType: null, // filter categories by type, null - show all
};

/**
 * Category DropDown component
 */
export class CategorySelect extends DropDown {
    constructor(props = {}) {
        super({
            ...props,
            ...defaultProps,
        });

        this.state = {
            ...this.state,
            transactionType: this.props.transactionType,
        };

        this.initCategories();
    }

    initCategories() {
        const { categories } = window.app.model;
        const { transactionType } = this.state;

        this.removeAll();

        this.addItem({ id: 0, title: __('NO_CATEGORY') });

        categories.forEach((category) => {
            if (
                category.parent_id !== 0
                || (
                    category.type !== 0
                    && transactionType !== null
                    && category.type !== transactionType
                )
            ) {
                return;
            }

            this.addItem({ id: category.id, title: category.name });
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
