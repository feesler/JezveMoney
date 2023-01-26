import { __ } from '../utils.js';
import { CategoryList } from './CategoryList.js';
import { ListItem } from './ListItem.js';
import { availTransTypes, Transaction } from './Transaction.js';

const availFields = [
    'id',
    'name',
    'parent_id',
    'type',
    'createdate',
    'updatedate',
    'transactionsCount',
    'pos',
    'children',
    'selected',
];

/**
 * @constructor Category class
 * @param {*} props
 */
export class Category extends ListItem {
    /** Return string for specified transaction type */
    static getTypeString(value) {
        return (value !== 0) ? Transaction.getTypeString(value) : 'any';
    }

    /** Return title string for specified transaction type */
    static getTypeTitle(value) {
        return (value !== 0) ? Transaction.getTypeTitle(value) : __('TR_ANY');
    }

    static getAvailTypes() {
        return [0, ...Object.keys(availTransTypes)];
    }

    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        return typeof field === 'string' && availFields.includes(field);
    }

    /**
     * Sets child categories
     * @param {CategoryList|Array} data
     */
    setChildren(data) {
        this.children = CategoryList.create(data);
    }
}
