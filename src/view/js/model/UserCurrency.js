import { ListItem } from './ListItem.js';

/** Available user currency fields */
const availFields = [
    'id',
    'curr_id',
    'flags',
    'pos',
    'createdate',
    'updatedate',
];

/**
 * @constructor UserCurrency class
 * @param {*} props
 */
export class UserCurrency extends ListItem {
    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        return typeof field === 'string' && availFields.includes(field);
    }
}
