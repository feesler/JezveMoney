import { List } from './List.js';
import { ImportTemplate } from './ImportTemplate.js';

/**
 * @constructor ImportTemplateList class
 * @param {object[]} props - array of import rules
 */
export class ImportTemplateList extends List {
    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new ImportTemplate(obj);
    }

    /** Searches for import template with specified name */
    findByName(name, caseSens = false) {
        if (typeof name !== 'string' || name.length === 0) {
            return null;
        }

        const lookupName = (caseSens) ? name : name.toLowerCase();
        return this.find((item) => (
            (caseSens)
                ? (item.name === lookupName)
                : (item.name.toLowerCase() === lookupName)
        ));
    }
}
