import { List } from './List.js';
import { Person } from './Person.js';

/**
 * @constructor PersonList class
 * @param {object[]} props - array of persons
 */
export class PersonList extends List {
    /** Static alias for PersonList constructor */
    static create(props) {
        return new PersonList(props);
    }

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
}
