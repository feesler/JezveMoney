import { List } from './List.js';
import { Category } from './Category.js';

export class CategoryList extends List {
    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Category(obj);
    }

    /** Returns array of ids of child categories */
    getChildren(id) {
        return this.filter((item) => item.parent_id === id).map((item) => item.id);
    }

    findByName(name, caseSens = false) {
        let lookupName;

        if (caseSens) {
            lookupName = name;
            return this.find((item) => item.name === lookupName);
        }

        lookupName = name.toLowerCase();
        return this.find((item) => item.name.toLowerCase() === lookupName);
    }
}
