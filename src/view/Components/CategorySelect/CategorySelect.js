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
            const children = categories.getChildren(category.id);
            if (children.length === 0) {
                return;
            }
            const group = this.addGroup();
            const groupItems = children.map((id) => {
                const child = categories.getItem(id);
                return { id: child.id, title: child.name, group };
            });
            this.append(groupItems);
        });
    }
}
