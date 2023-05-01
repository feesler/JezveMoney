import { ListItem } from './ListItem.js';

/**
 * Icon class
 */
export class Icon extends ListItem {
    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        const availFields = ['id', 'name', 'file', 'type'];

        return typeof field === 'string' && availFields.includes(field);
    }
}
