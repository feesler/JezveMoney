import { copyObject } from 'jezvejs';
import { ListItem } from './ListItem.js';
import { ImportTransactionForm } from '../../Components/Import/TransactionForm/ImportTransactionForm.js';
import { ImportTransactionItem } from '../../Components/Import/TransactionItem/ImportTransactionItem.js';

/** Action types */
export const IMPORT_ACTION_SET_TR_TYPE = 1;
export const IMPORT_ACTION_SET_ACCOUNT = 2;
export const IMPORT_ACTION_SET_PERSON = 3;
export const IMPORT_ACTION_SET_SRC_AMOUNT = 4;
export const IMPORT_ACTION_SET_DEST_AMOUNT = 5;
export const IMPORT_ACTION_SET_COMMENT = 6;

/** Action types */
const TITLE_ACTION_SET_TR_TYPE = 'Set transaction type';
const TITLE_ACTION_SET_ACCOUNT = 'Set account';
const TITLE_ACTION_SET_PERSON = 'Set person';
const TITLE_ACTION_SET_SRC_AMOUNT = 'Set source amount';
const TITLE_ACTION_SET_DEST_AMOUNT = 'Set destination amount';
const TITLE_ACTION_SET_COMMENT = 'Set comment';
/** Transaction types */
const TITLE_TRANS_EXPENSE = 'Expense';
const TITLE_TRANS_INCOME = 'Income';
const TITLE_TRANS_TRANSFER_FROM = 'Transfer from';
const TITLE_TRANS_TRANSFER_TO = 'Transfer to';
const TITLE_TRANS_DEBT_FROM = 'Debt from';
const TITLE_TRANS_DEBT_TO = 'Debt to';

/**
 * @constructor Import action class
 * @param {object} props - properties of instance
 */
export class ImportAction extends ListItem {
    /** List of available action types */
    static actionTypes = [
        { id: IMPORT_ACTION_SET_TR_TYPE, title: TITLE_ACTION_SET_TR_TYPE },
        { id: IMPORT_ACTION_SET_ACCOUNT, title: TITLE_ACTION_SET_ACCOUNT },
        { id: IMPORT_ACTION_SET_PERSON, title: TITLE_ACTION_SET_PERSON },
        { id: IMPORT_ACTION_SET_SRC_AMOUNT, title: TITLE_ACTION_SET_SRC_AMOUNT },
        { id: IMPORT_ACTION_SET_DEST_AMOUNT, title: TITLE_ACTION_SET_DEST_AMOUNT },
        { id: IMPORT_ACTION_SET_COMMENT, title: TITLE_ACTION_SET_COMMENT },
    ];

    /** List of action types requires select value from list */
    static selectActions = [
        IMPORT_ACTION_SET_TR_TYPE,
        IMPORT_ACTION_SET_ACCOUNT,
        IMPORT_ACTION_SET_PERSON,
    ];

    /** List of action types requires amount value */
    static amountActions = [
        IMPORT_ACTION_SET_SRC_AMOUNT,
        IMPORT_ACTION_SET_DEST_AMOUNT,
    ];

    /** List of available transaction types */
    static transactionTypes = [
        { id: 'expense', title: TITLE_TRANS_EXPENSE },
        { id: 'income', title: TITLE_TRANS_INCOME },
        { id: 'transferfrom', title: TITLE_TRANS_TRANSFER_FROM },
        { id: 'transferto', title: TITLE_TRANS_TRANSFER_TO },
        { id: 'debtfrom', title: TITLE_TRANS_DEBT_FROM },
        { id: 'debtto', title: TITLE_TRANS_DEBT_TO },
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

    /** Check action requires amount value */
    isAmountValue() {
        return ImportAction.isAmountValue(this.action_id);
    }

    /**
     * Execute import action
     * @param {ImportTransactionForm} context - import item component
     */
    execute(context) {
        if (!(context instanceof ImportTransactionForm)
            && !(context instanceof ImportTransactionItem)) {
            throw new Error('Invalid import item');
        }

        if (this.action_id === IMPORT_ACTION_SET_TR_TYPE) {
            context.setTransactionType(this.value);
        } else if (this.action_id === IMPORT_ACTION_SET_ACCOUNT) {
            context.setTransferAccount(this.value);
        } else if (this.action_id === IMPORT_ACTION_SET_PERSON) {
            context.setPerson(this.value);
        } else if (this.action_id === IMPORT_ACTION_SET_SRC_AMOUNT) {
            context.setSourceAmount(this.value);
        } else if (this.action_id === IMPORT_ACTION_SET_DEST_AMOUNT) {
            context.setDestAmount(this.value);
        } else if (this.action_id === IMPORT_ACTION_SET_COMMENT) {
            context.setComment(this.value);
        } else {
            throw new Error('Invalid action');
        }
    }
}
