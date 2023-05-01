import { copyObject, isFunction } from 'jezvejs';
import { __ } from '../utils/utils.js';
import { ListItem } from './ListItem.js';
import { ImportTransaction } from './ImportTransaction.js';

/** Action types */
export const IMPORT_ACTION_SET_TR_TYPE = 1;
export const IMPORT_ACTION_SET_ACCOUNT = 2;
export const IMPORT_ACTION_SET_PERSON = 3;
export const IMPORT_ACTION_SET_SRC_AMOUNT = 4;
export const IMPORT_ACTION_SET_DEST_AMOUNT = 5;
export const IMPORT_ACTION_SET_COMMENT = 6;
export const IMPORT_ACTION_SET_CATEGORY = 7;

/* Action handlers map */
const actionHandlers = {
    [IMPORT_ACTION_SET_TR_TYPE]: (ctx, value) => ctx.setTransactionType(value),
    [IMPORT_ACTION_SET_ACCOUNT]: (ctx, value) => ctx.setTransferAccount(value),
    [IMPORT_ACTION_SET_PERSON]: (ctx, value) => ctx.setPerson(value),
    [IMPORT_ACTION_SET_SRC_AMOUNT]: (ctx, value) => ctx.setSourceAmount(value),
    [IMPORT_ACTION_SET_DEST_AMOUNT]: (ctx, value) => ctx.setDestAmount(value),
    [IMPORT_ACTION_SET_COMMENT]: (ctx, value) => ctx.setComment(value),
    [IMPORT_ACTION_SET_CATEGORY]: (ctx, value) => ctx.setCategory(value),
};

/**
 * @constructor Import action class
 * @param {object} props - properties of instance
 */
export class ImportAction extends ListItem {
    /** List of available action types */
    static actionTypes = [
        { id: IMPORT_ACTION_SET_TR_TYPE, title: __('ACTION_SET_TR_TYPE') },
        { id: IMPORT_ACTION_SET_ACCOUNT, title: __('ACTION_SET_ACCOUNT') },
        { id: IMPORT_ACTION_SET_PERSON, title: __('ACTION_SET_PERSON') },
        { id: IMPORT_ACTION_SET_SRC_AMOUNT, title: __('ACTION_SET_SRC_AMOUNT') },
        { id: IMPORT_ACTION_SET_DEST_AMOUNT, title: __('ACTION_SET_DEST_AMOUNT') },
        { id: IMPORT_ACTION_SET_COMMENT, title: __('ACTION_SET_COMMENT') },
        { id: IMPORT_ACTION_SET_CATEGORY, title: __('ACTION_SET_CATEGORY') },
    ];

    /** List of action types requires select value from list */
    static selectActions = [
        IMPORT_ACTION_SET_TR_TYPE,
        IMPORT_ACTION_SET_ACCOUNT,
        IMPORT_ACTION_SET_PERSON,
        IMPORT_ACTION_SET_CATEGORY,
    ];

    /** List of action types requires amount value */
    static amountActions = [
        IMPORT_ACTION_SET_SRC_AMOUNT,
        IMPORT_ACTION_SET_DEST_AMOUNT,
    ];

    /** List of available transaction types */
    static transactionTypes = [
        { id: 'expense', title: __('TR_EXPENSE') },
        { id: 'income', title: __('TR_INCOME') },
        { id: 'transfer_out', title: __('TR_TRANSFER_OUT') },
        { id: 'transfer_in', title: __('TR_TRANSFER_IN') },
        { id: 'debt_out', title: __('TR_DEBT_OUT') },
        { id: 'debt_in', title: __('TR_DEBT_IN') },
        { id: 'limit', title: __('TR_LIMIT_CHANGE') },
    ];

    /** Return array of available action types */
    static getTypes() {
        return copyObject(this.actionTypes);
    }

    /** Search action type by id */
    static getActionById(value) {
        const id = parseInt(value, 10);
        if (!id) {
            return null;
        }

        const res = this.actionTypes.find((item) => item.id === id);
        if (!res) {
            return null;
        }

        return copyObject(res);
    }

    /** Check action type requires select value from list */
    static isSelectValue(value) {
        return this.selectActions.includes(parseInt(value, 10));
    }

    /** Check action type requires transaction type value */
    static isTransactionTypeValue(value) {
        return parseInt(value, 10) === IMPORT_ACTION_SET_TR_TYPE;
    }

    /** Check action type requires account id value */
    static isAccountValue(value) {
        return parseInt(value, 10) === IMPORT_ACTION_SET_ACCOUNT;
    }

    /** Check action type requires person id value */
    static isPersonValue(value) {
        return parseInt(value, 10) === IMPORT_ACTION_SET_PERSON;
    }

    /** Check action type requires category id value */
    static isCategoryValue(value) {
        return parseInt(value, 10) === IMPORT_ACTION_SET_CATEGORY;
    }

    /** Check action type requires amount value */
    static isAmountValue(value) {
        return this.amountActions.includes(parseInt(value, 10));
    }

    /** Return array of available transaction types */
    static getTransactionTypes() {
        return copyObject(this.transactionTypes);
    }

    /** Search transaction type by id */
    static getTransactionTypeById(value) {
        const res = this.transactionTypes.find((item) => item.id === value);
        if (!res) {
            return null;
        }

        return copyObject(res);
    }

    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        const availFields = ['id', 'rule_id', 'action_id', 'value'];

        return typeof field === 'string' && availFields.includes(field);
    }

    /** Check action requires select value from list */
    isSelectValue() {
        return ImportAction.isSelectValue(this.action_id);
    }

    /** Check action requires account value */
    isAccountValue() {
        return ImportAction.isAccountValue(this.action_id);
    }

    /** Check action requires person value */
    isPersonValue() {
        return ImportAction.isPersonValue(this.action_id);
    }

    /** Check action requires category value */
    isCategoryValue() {
        return ImportAction.isCategoryValue(this.action_id);
    }

    /** Check action requires amount value */
    isAmountValue() {
        return ImportAction.isAmountValue(this.action_id);
    }

    /**
     * Execute import action
     * @param {ImportTransaction} context - import item component
     */
    execute(context) {
        if (!(context instanceof ImportTransaction)) {
            throw new Error('Invalid import item');
        }

        const handler = actionHandlers[this.action_id];
        if (!isFunction(handler)) {
            throw new Error('Invalid action');
        }

        return handler(context, this.value);
    }

    /** Check action match search filter */
    isMatchFilter(value) {
        const lower = value.toLowerCase();

        if (this.isAccountValue()) {
            const account = window.app.model.accounts.getItem(this.value);
            if (!account) {
                return false;
            }

            return account.name.toLowerCase().includes(lower);
        }

        if (this.isPersonValue()) {
            const person = window.app.model.persons.getItem(this.value);
            if (!person) {
                return false;
            }

            return person.name.toLowerCase().includes(lower);
        }

        if (this.isCategoryValue()) {
            const category = window.app.model.categories.getItem(this.value);
            if (!category) {
                return false;
            }

            return category.name.toLowerCase().includes(lower);
        }

        return this.value.toLowerCase().includes(lower);
    }
}
