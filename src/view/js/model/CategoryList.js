import { List } from './List.js';
import { Category } from './Category.js';

/**
 * @constructor CategoryList class
 * @param {object[]} props - array of categories
 */
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

    /** Search category with specified name */
    findByName(name, caseSens = false) {
        if (typeof name !== 'string' || name.length === 0) {
            return null;
        }

        const lookupName = (caseSens) ? name : name.toLowerCase();
        return this.find((person) => (
            (caseSens)
                ? (person.name === lookupName)
                : (person.name.toLowerCase() === lookupName)
        ));
    }
}
