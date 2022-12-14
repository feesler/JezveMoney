import { List } from './List.js';
import { Category } from './Category.js';

export class CategoryList extends List {
    setData(data) {
        super.setData(data);

        this.sortByParent();
    }

    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Category(obj);
    }

    /** Returns array of ids of child categories */
    findByParent(id) {
        return this.filter((item) => item.parent_id === id);
    }

    /** Search category with specified name */
    findByName(name, caseSens = false) {
        let lookupName;

        if (caseSens) {
            lookupName = name;
            return this.find((item) => item.name === lookupName);
        }

        lookupName = name.toLowerCase();
        return this.find((item) => item.name.toLowerCase() === lookupName);
    }

    /** Sort categories by parent */
    sortByParent() {
        const topLevelCategories = this.findByParent(0);
        this.data = topLevelCategories.flatMap((item) => {
            const children = this.findByParent(item.id);
            return [item, ...children];
        });
    }
}
