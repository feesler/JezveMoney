import { ListItem } from './ListItem.js';

/* eslint no-bitwise: "off" */

/** Account flags */
export const ACCOUNT_HIDDEN = 1;

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
        const availFields = [
            'id', 'owner_id', 'name', 'balance', 'initbalance', 'curr_id', 'icon_id', 'flags',
        ];

        return typeof field === 'string' && availFields.includes(field);
    }

    /**
     * Check account is not hidden
     */
    isVisible() {
        if (!('flags' in this)) {
            throw new Error('Invalid account');
        }

        return (this.flags & ACCOUNT_HIDDEN) === 0;
    }
}
