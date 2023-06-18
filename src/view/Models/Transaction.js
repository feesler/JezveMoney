import { __ } from '../utils/utils.js';

/** Types of transactions */
export const EXPENSE = 1;
export const INCOME = 2;
export const TRANSFER = 3;
export const DEBT = 4;
export const LIMIT_CHANGE = 5;

export const availTransTypes = {
    [EXPENSE]: 'expense',
    [INCOME]: 'income',
    [TRANSFER]: 'transfer',
    [DEBT]: 'debt',
    [LIMIT_CHANGE]: 'limit',
};

const transTitles = {
    [EXPENSE]: __('transactions.types.expense'),
    [INCOME]: __('transactions.types.income'),
    [TRANSFER]: __('transactions.types.transfer'),
    [DEBT]: __('transactions.types.debt'),
    [LIMIT_CHANGE]: __('transactions.types.creditLimit'),
};

export class Transaction {
    /** Return string for specified transaction type */
    static getTypeString(value) {
        const type = parseInt(value, 10);
        if (!availTransTypes[type]) {
            return null;
        }

        return availTransTypes[type];
    }

    /** Return title string for specified transaction type */
    static getTypeTitle(value) {
        const type = parseInt(value, 10);
        if (!transTitles[type]) {
            return null;
        }

        return transTitles[type];
    }
}
