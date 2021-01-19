/* eslint-disable no-bitwise */

/** Condition field types */
export const IMPORT_COND_FIELD_MAIN_ACCOUNT = 1;
export const IMPORT_COND_FIELD_TPL = 2;
export const IMPORT_COND_FIELD_TR_AMOUNT = 3;
export const IMPORT_COND_FIELD_TR_CURRENCY = 4;
export const IMPORT_COND_FIELD_ACC_AMOUNT = 5;
export const IMPORT_COND_FIELD_ACC_CURRENCY = 6;
export const IMPORT_COND_FIELD_COMMENT = 7;
export const IMPORT_COND_FIELD_DATE = 8;
/** Condition operators */
export const IMPORT_COND_OP_STRING_INCLUDES = 1;
export const IMPORT_COND_OP_EQUAL = 2;
export const IMPORT_COND_OP_NOT_EQUAL = 3;
export const IMPORT_COND_OP_LESS = 4;
export const IMPORT_COND_OP_GREATER = 5;
/** Condition flags */
export const IMPORT_COND_OP_FIELD_FLAG = 0x01;

/** Import condition model */
export class ImportCondition {
    /** Amount field types */
    static amountFields = [
        IMPORT_COND_FIELD_TR_AMOUNT,
        IMPORT_COND_FIELD_ACC_AMOUNT,
    ];

    /** Currency field types */
    static currencyFields = [
        IMPORT_COND_FIELD_TR_CURRENCY,
        IMPORT_COND_FIELD_ACC_CURRENCY,
    ];

    /** Item(account, template, currency) operators */
    static itemOperators = [
        IMPORT_COND_OP_EQUAL,
        IMPORT_COND_OP_NOT_EQUAL,
    ];

    /** Numeric(amount and date) operators */
    static numOperators = [
        IMPORT_COND_OP_EQUAL,
        IMPORT_COND_OP_NOT_EQUAL,
        IMPORT_COND_OP_LESS,
        IMPORT_COND_OP_GREATER,
    ];

    /** String operators */
    static stringOperators = [
        IMPORT_COND_OP_STRING_INCLUDES,
        IMPORT_COND_OP_EQUAL,
        IMPORT_COND_OP_NOT_EQUAL,
        IMPORT_COND_OP_LESS,
        IMPORT_COND_OP_GREATER,
    ];

    /** List of available field types */
    static fieldTypes = [
        { id: IMPORT_COND_FIELD_MAIN_ACCOUNT, title: 'Main account', operators: ImportCondition.itemOperators },
        { id: IMPORT_COND_FIELD_TPL, title: 'Template', operators: ImportCondition.itemOperators },
        { id: IMPORT_COND_FIELD_TR_AMOUNT, title: 'Transaction amount', operators: ImportCondition.numOperators },
        { id: IMPORT_COND_FIELD_TR_CURRENCY, title: 'Transaction currency', operators: ImportCondition.itemOperators },
        { id: IMPORT_COND_FIELD_ACC_AMOUNT, title: 'Account amount', operators: ImportCondition.numOperators },
        { id: IMPORT_COND_FIELD_ACC_CURRENCY, title: 'Account currency', operators: ImportCondition.itemOperators },
        { id: IMPORT_COND_FIELD_DATE, title: 'Date', operators: ImportCondition.numOperators },
        { id: IMPORT_COND_FIELD_COMMENT, title: 'Comment', operators: ImportCondition.stringOperators },
    ];

    /** List of available condition operator types */
    static operatorTypes = [
        { id: IMPORT_COND_OP_STRING_INCLUDES, title: 'Includes' },
        { id: IMPORT_COND_OP_EQUAL, title: 'Equal to' },
        { id: IMPORT_COND_OP_NOT_EQUAL, title: 'Not equal to' },
        { id: IMPORT_COND_OP_LESS, title: 'Less than' },
        { id: IMPORT_COND_OP_GREATER, title: 'Greater than' },
    ];

    /** Check value for specified field type is account */
    static isAccountField(value) {
        return parseInt(value, 10) === IMPORT_COND_FIELD_MAIN_ACCOUNT;
    }

    /** Check value for specified field type is template */
    static isTemplateField(value) {
        return parseInt(value, 10) === IMPORT_COND_FIELD_TPL;
    }

    /** Check value for specified field type is currency */
    static isCurrencyField(value) {
        return ImportCondition.currencyFields.includes(parseInt(value, 10));
    }

    /** Check value for specified field type is amount */
    static isAmountField(value) {
        return ImportCondition.amountFields.includes(parseInt(value, 10));
    }

    /** Check value for specified field type is string */
    static isDateField(value) {
        return parseInt(value, 10) === IMPORT_COND_FIELD_DATE;
    }

    /** Check value for specified field type is string */
    static isStringField(value) {
        return parseInt(value, 10) === IMPORT_COND_FIELD_COMMENT;
    }

    /** Search condition field type by id */
    static getFieldTypeById(value) {
        const id = parseInt(value, 10);
        if (!id) {
            throw new Error('Invalid parameter');
        }

        return ImportCondition.fieldTypes.find((item) => item.id === id);
    }

    /** Search condition field type by name (case insensitive) */
    static findFieldTypeByName(name) {
        if (typeof name !== 'string') {
            throw new Error('Invalid parameter');
        }

        const lcName = name.toLowerCase();
        return ImportCondition.fieldTypes.find((item) => item.title.toLowerCase() === lcName);
    }

    /** Search condition operator by id */
    static getOperatorById(value) {
        const id = parseInt(value, 10);
        if (!id) {
            throw new Error('Invalid parameter');
        }

        return ImportCondition.operatorTypes.find((item) => item.id === id);
    }

    /** Search condition operator by name (case insensitive) */
    static findOperatorByName(name) {
        if (typeof name !== 'string') {
            throw new Error('Invalid parameter');
        }

        const lcName = name.toLowerCase();
        return ImportCondition.operatorTypes.find((item) => item.title.toLowerCase() === lcName);
    }

    /** Check field value flag */
    static isFieldValueFlag(value) {
        const flags = parseInt(value, 10);
        if (Number.isNaN(flags)) {
            throw new Error('Invalid flags value');
        }

        return (flags & IMPORT_COND_OP_FIELD_FLAG) === IMPORT_COND_OP_FIELD_FLAG;
    }
}
