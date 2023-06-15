import { hasFlag } from 'jezvejs';
import { __ } from '../utils/utils.js';
import { ListItem } from './ListItem.js';

/** Account flags */
export const ACCOUNT_HIDDEN = 1;

/** Account types */
export const ACCOUNT_TYPE_OTHER = 0;
export const ACCOUNT_TYPE_CASH = 1;
export const ACCOUNT_TYPE_DEBIT_CARD = 2;
export const ACCOUNT_TYPE_CREDIT_CARD = 3;
export const ACCOUNT_TYPE_CREDIT = 4;
export const ACCOUNT_TYPE_DEPOSIT = 5;

/** Account type names map */
export const accountTypes = {
    [ACCOUNT_TYPE_OTHER]: __('accounts.types.other'),
    [ACCOUNT_TYPE_CASH]: __('accounts.types.cash'),
    [ACCOUNT_TYPE_DEBIT_CARD]: __('accounts.types.debitCard'),
    [ACCOUNT_TYPE_CREDIT_CARD]: __('accounts.types.creditCard'),
    [ACCOUNT_TYPE_CREDIT]: __('accounts.types.credit'),
    [ACCOUNT_TYPE_DEPOSIT]: __('accounts.types.deposit'),
};

/** Available account fields */
const availFields = [
    'id',
    'owner_id',
    'type',
    'name',
    'balance',
    'initbalance',
    'limit',
    'initlimit',
    'curr_id',
    'icon_id',
    'flags',
    'createdate',
    'updatedate',
    'transactionsCount',
    'pos',
];

/**
 * Account class
 * @param {*} props
 */
export class Account extends ListItem {
    /**
     * Returns true if specified type is credit card
     * @param {*} type
     */
    static isCreditCard(type) {
        return parseInt(type, 10) === ACCOUNT_TYPE_CREDIT_CARD;
    }

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
