import { assert } from 'jezve-test';
import { fixFloat } from '../common.js';
import { App } from '../Application.js';
import { ImportTransaction } from './ImportTransaction.js';
import { __ } from './locale.js';

/** Action types */
export const IMPORT_ACTION_SET_TR_TYPE = 1;
export const IMPORT_ACTION_SET_ACCOUNT = 2;
export const IMPORT_ACTION_SET_PERSON = 3;
export const IMPORT_ACTION_SET_SRC_AMOUNT = 4;
export const IMPORT_ACTION_SET_DEST_AMOUNT = 5;
export const IMPORT_ACTION_SET_COMMENT = 6;
export const IMPORT_ACTION_SET_CATEGORY = 7;

export const ImportActionTypes = {
    setTransactionType: IMPORT_ACTION_SET_TR_TYPE,
    setAccount: IMPORT_ACTION_SET_ACCOUNT,
    setPerson: IMPORT_ACTION_SET_PERSON,
    setSourceAmount: IMPORT_ACTION_SET_SRC_AMOUNT,
    setDestAmount: IMPORT_ACTION_SET_DEST_AMOUNT,
    setComment: IMPORT_ACTION_SET_COMMENT,
    setCategory: IMPORT_ACTION_SET_CATEGORY,
};

export const actions = {
    setTransactionType: (value) => ({ action_id: ImportActionTypes.setTransactionType, value }),
    setAccount: (value) => ({ action_id: ImportActionTypes.setAccount, value }),
    setPerson: (value) => ({ action_id: ImportActionTypes.setPerson, value }),
    setSourceAmount: (value) => ({ action_id: ImportActionTypes.setSourceAmount, value }),
    setDestAmount: (value) => ({ action_id: ImportActionTypes.setDestAmount, value }),
    setComment: (value) => ({ action_id: ImportActionTypes.setComment, value }),
    setCategory: (value) => ({ action_id: ImportActionTypes.setCategory, value }),
};

/** Import action model */
export class ImportAction {
    constructor(data) {
        const requiredProps = ['action_id', 'value'];

        assert(data, 'Invalid data');

        requiredProps.forEach((propName) => {
            assert(propName in data, `Property '${propName}' not found.`);

            this[propName] = data[propName];
        });
    }

    /** Validate action amount value */
    isValidAmount(value) {
        const amount = parseFloat(fixFloat(value));
        return (!Number.isNaN(amount) && amount > 0);
    }

    /** Check correctness of action */
    validate() {
        if (!(this.action_id in ImportAction.actionsMap)) {
            return false;
        }

        if (this.action_id === IMPORT_ACTION_SET_TR_TYPE) {
            if (!(this.value in ImportTransaction.typesMap)) {
                return false;
            }
        } else if (this.isAccountValue()) {
            const account = App.state.accounts.getItem(this.value);
            if (!account) {
                return false;
            }
        } else if (this.isPersonValue()) {
            const person = App.state.persons.getItem(this.value);
            if (!person) {
                return false;
            }
        } else if (this.isAmountValue()) {
            if (!this.isValidAmount(this.value)) {
                return false;
            }
        } else if (this.action_id === IMPORT_ACTION_SET_CATEGORY) {
            const categoryId = parseInt(this.value, 10);
            const category = App.state.categories.getItem(this.value);
            if (categoryId !== 0 && !category) {
                return false;
            }
        }

        return true;
    }

    static actionTypes = [
        { id: IMPORT_ACTION_SET_TR_TYPE, titleToken: 'ACTION_SET_TR_TYPE' },
        { id: IMPORT_ACTION_SET_ACCOUNT, titleToken: 'ACTION_SET_ACCOUNT' },
        { id: IMPORT_ACTION_SET_PERSON, titleToken: 'ACTION_SET_PERSON' },
        { id: IMPORT_ACTION_SET_SRC_AMOUNT, titleToken: 'ACTION_SET_SRC_AMOUNT' },
        { id: IMPORT_ACTION_SET_DEST_AMOUNT, titleToken: 'ACTION_SET_DEST_AMOUNT' },
        { id: IMPORT_ACTION_SET_COMMENT, titleToken: 'ACTION_SET_COMMENT' },
        { id: IMPORT_ACTION_SET_CATEGORY, titleToken: 'ACTION_SET_CATEGORY' },
    ];

    static actionsMap = {
        [IMPORT_ACTION_SET_TR_TYPE]: 'setTransactionType',
        [IMPORT_ACTION_SET_ACCOUNT]: 'setAccount',
        [IMPORT_ACTION_SET_PERSON]: 'setPerson',
        [IMPORT_ACTION_SET_SRC_AMOUNT]: 'setSourceAmount',
        [IMPORT_ACTION_SET_DEST_AMOUNT]: 'setDestAmount',
        [IMPORT_ACTION_SET_COMMENT]: 'setComment',
        [IMPORT_ACTION_SET_CATEGORY]: 'setCategory',
    };

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

    /** Search action type by id */
    static getActionById(value) {
        const id = parseInt(value, 10);
        assert(id, 'Invalid parameter');

        return this.actionTypes.find((item) => item.id === id);
    }

    /** Search action type by name (case insensitive) */
    static findActionByName(name, locale) {
        assert.isString(name, 'Invalid parameter');

        const lcName = name.toLowerCase();
        return this.actionTypes.find((item) => (
            __(item.titleToken, locale).toLowerCase() === lcName
        ));
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
    * Execute import action on specified context
    * @param {ImportTransaction} context - import transaction object
    */
    execute(context) {
        assert.instanceOf(context, ImportTransaction, 'Invalid import item');
        assert(this.action_id in ImportAction.actionsMap, 'Invalid action');

        const actionName = ImportAction.actionsMap[this.action_id];
        assert.isFunction(context[actionName], 'Invalid action');

        context[actionName](this.value);
    }

    /** Check action match search filter */
    isMatchFilter(value) {
        const lower = value.toLowerCase();

        if (this.isAccountValue()) {
            const account = App.state.accounts.getItem(this.value);
            if (!account) {
                return false;
            }

            return account.name.toLowerCase().includes(lower);
        }

        if (this.isPersonValue()) {
            const person = App.state.persons.getItem(this.value);
            if (!person) {
                return false;
            }

            return person.name.toLowerCase().includes(lower);
        }

        if (this.isCategoryValue()) {
            const category = App.state.categories.getItem(this.value);
            if (!category) {
                return false;
            }

            return category.name.toLowerCase().includes(lower);
        }

        return this.value.toLowerCase().includes(lower);
    }
}
