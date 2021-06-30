import { List } from './List.js';
import { ImportTemplate } from './ImportTemplate.js';

/**
 * @constructor ImportTemplateList class
 * @param {object[]} props - array of import rules
 */
export class ImportTemplateList extends List {
    /** Static alias for ImportTemplateList constructor */
    static create(props) {
        return new ImportTemplateList(props);
    }

    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new ImportTemplate(obj);
    }
}
