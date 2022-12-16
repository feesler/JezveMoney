import { DropDown } from 'jezvejs/DropDown';

const TITLE_NO_CATEGORY = 'No category';

/**
 * Category DropDown component
 */
export class CategorySelect extends DropDown {
    constructor(props) {
        super(props);

        this.initCategories();
    }

    initCategories() {
        const { categories } = window.app.model;

        this.addItem({ id: 0, title: TITLE_NO_CATEGORY });

        categories.forEach((category) => {
            if (category.parent_id !== 0) {
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
}
