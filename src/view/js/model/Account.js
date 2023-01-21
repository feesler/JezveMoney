import { hasFlag } from 'jezvejs';
import { ListItem } from './ListItem.js';

/** Account flags */
export const ACCOUNT_HIDDEN = 1;
/** Available account fields */
const availFields = [
    'id',
    'owner_id',
    'name',
    'balance',
    'initbalance',
    'curr_id',
    'icon_id',
    'flags',
    'createdate',
    'updatedate',
    'transactionsCount',
];

/**
 * Account class
 * @param {*} props
 */
export class Account extends ListItem {
    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        return typeof field === 'string' && availFields.includes(field);
    }

    /**
     * Check account is not hidden
     */
    isVisible() {
        if (!('flags' in this)) {
            throw new Error('Invalid account');
        }

        return !hasFlag(this.flags, ACCOUNT_HIDDEN);
    }
}
