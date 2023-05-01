import { List } from './List.js';
import { Person } from './Person.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
} from '../utils/utils.js';

/**
 * @constructor PersonList class
 * @param {object[]} props - array of persons
 */
export class PersonList extends List {
    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Person(obj);
    }

    /**
     * Return list of visible Persons
     */
    getVisible() {
        return this.filter((item) => item && item.isVisible());
    }

    /** Return list of hidden Persons */
    getHidden() {
        return this.filter((item) => item && !item.isVisible());
    }

    /** Search person with specified name */
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
