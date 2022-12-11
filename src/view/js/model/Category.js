import { ListItem } from './ListItem.js';

/**
 * @constructor Category class
 * @param {*} props
 */
export class Category extends ListItem {
    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        const availFields = ['id', 'name', 'parent_id', 'type'];

        return typeof field === 'string' && availFields.includes(field);
    }
}
