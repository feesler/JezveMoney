import { List } from './List.js';
import { Category } from './Category.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
} from '../utils/utils.js';

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
    findByParent(id) {
        return this.filter((item) => item.parent_id === id);
    }

    /** Returns array of categories for specified transaction type */
    findByType(type) {
        return this.filter((item) => item.type === type);
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

    /** Returns array of items with specified color */
    findByColor(color, parentId = 0) {
        const categoryId = parseInt(parentId, 10);
        return this.filter((item) => (item.color === color && item.parent_id === categoryId));
    }

    sortBy(sortMode) {
        if (sortMode === SORT_BY_CREATEDATE_ASC) {
            this.sortByCreateDateAsc();
        } else if (sortMode === SORT_BY_CREATEDATE_DESC) {
            this.sortByCreateDateDesc();
        } else if (sortMode === SORT_BY_NAME_ASC) {
            this.sortByNameAsc();
        } else if (sortMode === SORT_BY_NAME_DESC) {
            this.sortByNameDesc();
        } else if (sortMode === SORT_MANUALLY) {
            this.sortByPos();
        }
    }

    sortByPos() {
        this.sort((a, b) => a.pos - b.pos);
    }

    sortByNameAsc() {
        this.sort((a, b) => ((a.name > b.name) ? 1 : -1));
    }

    sortByNameDesc() {
        this.sort((a, b) => ((a.name < b.name) ? 1 : -1));
    }

    sortByCreateDateAsc() {
        this.sort((a, b) => a.id - b.id);
    }

    sortByCreateDateDesc() {
        this.sort((a, b) => b.id - a.id);
    }
}
