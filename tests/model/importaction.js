/** Action types */
export const IMPORT_ACTION_SET_TR_TYPE = 1;
export const IMPORT_ACTION_SET_ACCOUNT = 2;
export const IMPORT_ACTION_SET_PERSON = 3;
export const IMPORT_ACTION_SET_SRC_AMOUNT = 4;
export const IMPORT_ACTION_SET_DEST_AMOUNT = 5;
export const IMPORT_ACTION_SET_COMMENT = 6;

/** Import action model */
export class ImportAction {
    static actionTypes = [
        { id: IMPORT_ACTION_SET_TR_TYPE, title: 'Set transaction type' },
        { id: IMPORT_ACTION_SET_ACCOUNT, title: 'Set account' },
        { id: IMPORT_ACTION_SET_PERSON, title: 'Set person' },
        { id: IMPORT_ACTION_SET_SRC_AMOUNT, title: 'Set source amount' },
        { id: IMPORT_ACTION_SET_DEST_AMOUNT, title: 'Set destination amount' },
        { id: IMPORT_ACTION_SET_COMMENT, title: 'Set comment' },
    ];

    /** List of available transaction types */
    static transactionTypes = [
        { id: 'expense', title: 'Expense' },
        { id: 'income', title: 'Income' },
        { id: 'transferfrom', title: 'Transfer from' },
        { id: 'transferto', title: 'Transfer to' },
        { id: 'debtfrom', title: 'Debt from' },
        { id: 'debtto', title: 'Debt to' },
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

    /** Check action type requires select value from list */
    static isSelectValue(value) {
        return ImportAction.selectActions.includes(parseInt(value, 10));
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
        return ImportAction.amountActions.includes(parseInt(value, 10));
    }

    /** Search action type by id */
    static getActionById(value) {
        const id = parseInt(value, 10);
        if (!id) {
            throw new Error('Invalid parameter');
        }

        return ImportAction.actionTypes.find((item) => item.id === id);
    }

    /** Search action type by name (case insensitive) */
    static findActionByName(name) {
        if (typeof name !== 'string') {
            throw new Error('Invalid parameter');
        }

        const lcName = name.toLowerCase();
        return ImportAction.actionTypes.find((item) => item.title.toLowerCase() === lcName);
    }

    /**
     * Search import transaction type by id
     * @param {string} id - transaction type id string
     */
    static getTransactionTypeById(value) {
        return ImportAction.transactionTypes.find((item) => item.id === value);
    }

    /** Search import transaction type by name (case insensitive) */
    static findTransactionTypeByName(name) {
        if (typeof name !== 'string') {
            throw new Error('Invalid parameter');
        }

        const lcName = name.toLowerCase();
        return ImportAction.transactionTypes.find((item) => item.title.toLowerCase() === lcName);
    }
}
