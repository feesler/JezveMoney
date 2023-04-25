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
}
