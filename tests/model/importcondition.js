import { isObject, convDate } from '../common.js';

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
    constructor(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.field_id = data.field_id;
        this.operator = data.operator;
        this.value = data.value;
        this.flags = data.flags;
    }

    /** Item field types */
    static itemFields = [
        IMPORT_COND_FIELD_MAIN_ACCOUNT,
        IMPORT_COND_FIELD_TPL,
        IMPORT_COND_FIELD_TR_CURRENCY,
        IMPORT_COND_FIELD_ACC_CURRENCY,
    ];

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

    /** Field type to data property name map */
    static fieldsMap = {
        [IMPORT_COND_FIELD_MAIN_ACCOUNT]: 'mainAccount',
        [IMPORT_COND_FIELD_TPL]: 'template',
        [IMPORT_COND_FIELD_TR_AMOUNT]: 'trAmountVal',
        [IMPORT_COND_FIELD_TR_CURRENCY]: 'trCurrVal',
        [IMPORT_COND_FIELD_ACC_AMOUNT]: 'accAmountVal',
        [IMPORT_COND_FIELD_ACC_CURRENCY]: 'accCurrVal',
        [IMPORT_COND_FIELD_DATE]: 'date',
        [IMPORT_COND_FIELD_COMMENT]: 'comment',
    };

    /** Operator functions map */
    static operatorsMap = {
        [IMPORT_COND_OP_STRING_INCLUDES]: (left, right) => left.includes(right),
        [IMPORT_COND_OP_EQUAL]: (left, right) => left === right,
        [IMPORT_COND_OP_NOT_EQUAL]: (left, right) => left !== right,
        [IMPORT_COND_OP_LESS]: (left, right) => left < right,
        [IMPORT_COND_OP_GREATER]: (left, right) => left > right,
    };

    /** List of available condition operator types */
    static operatorTypes = [
        { id: IMPORT_COND_OP_STRING_INCLUDES, title: 'Includes' },
        { id: IMPORT_COND_OP_EQUAL, title: 'Equal to' },
        { id: IMPORT_COND_OP_NOT_EQUAL, title: 'Not equal to' },
        { id: IMPORT_COND_OP_LESS, title: 'Less than' },
        { id: IMPORT_COND_OP_GREATER, title: 'Greater than' },
    ];

    /**
    * Return data value for specified field type
    * @param {string} field - field name to check
    */
    static getFieldValue(fieldId, data) {
        const field = parseInt(fieldId, 10);
        if (!field || !(field in this.fieldsMap)) {
            throw new Error(`Invalid field id: ${fieldId}`);
        }
        if (!isObject(data)) {
            throw new Error('Invalid transaction data');
        }

        const dataProp = this.fieldsMap[field];
        return data[dataProp];
    }

    /** Check value for specified field type is account */
    static isItemField(value) {
        return this.itemFields.includes(parseInt(value, 10));
    }

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
        return this.currencyFields.includes(parseInt(value, 10));
    }

    /** Check value for specified field type is amount */
    static isAmountField(value) {
        return this.amountFields.includes(parseInt(value, 10));
    }

    /** Check value for specified field type is date */
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

        return this.fieldTypes.find((item) => item.id === id);
    }

    /** Search condition field type by name (case insensitive) */
    static findFieldTypeByName(name) {
        if (typeof name !== 'string') {
            throw new Error('Invalid parameter');
        }

        const lcName = name.toLowerCase();
        return this.fieldTypes.find((item) => item.title.toLowerCase() === lcName);
    }

    /** Search condition operator by id */
    static getOperatorById(value) {
        const id = parseInt(value, 10);
        if (!id) {
            throw new Error('Invalid parameter');
        }

        return this.operatorTypes.find((item) => item.id === id);
    }

    /** Search condition operator by name (case insensitive) */
    static findOperatorByName(name) {
        if (typeof name !== 'string') {
            throw new Error('Invalid parameter');
        }

        const lcName = name.toLowerCase();
        return this.operatorTypes.find((item) => item.title.toLowerCase() === lcName);
    }

    /** Check specified value is item operator(equal or not equal) */
    static isItemOperator(value) {
        return this.itemOperators.includes(parseInt(value, 10));
    }

    /** Check specified value is numeric operator */
    static isNumOperator(value) {
        return this.numOperators.includes(parseInt(value, 10));
    }

    /** Check specified value is string operator */
    static isStringOperator(value) {
        return this.stringOperators.includes(parseInt(value, 10));
    }

    /** Check field value flag */
    static isPropertyValueFlag(value) {
        const flags = parseInt(value, 10);
        if (Number.isNaN(flags)) {
            throw new Error('Invalid flags value');
        }

        return (flags & IMPORT_COND_OP_FIELD_FLAG) === IMPORT_COND_OP_FIELD_FLAG;
    }

    /** Check field type of condition is account */
    isItemField() {
        return ImportCondition.isItemField(this.field_id);
    }

    /** Check field type of condition is account */
    isAccountField() {
        return ImportCondition.isAccountField(this.field_id);
    }

    /** Check field type of condition is template */
    isTemplateField() {
        return ImportCondition.isTemplateField(this.field_id);
    }

    /** Check field type of condition is currency */
    isCurrencyField() {
        return ImportCondition.isCurrencyField(this.field_id);
    }

    /** Check field type of condition is amount */
    isAmountField() {
        return ImportCondition.isAmountField(this.field_id);
    }

    /** Check field type of condition is date */
    isDateField() {
        return ImportCondition.isDateField(this.field_id);
    }

    /** Check field type of condition is string */
    isStringField() {
        return ImportCondition.isStringField(this.field_id);
    }

    /** Check condition use item operator */
    isItemOperator() {
        return ImportCondition.isItemOperator(this.operator);
    }

    /** Check condition use numeric operator */
    isNumOperator() {
        return ImportCondition.isNumOperator(this.operator);
    }

    /** Check condition use string operator */
    isStringOperator() {
        return ImportCondition.isStringOperator(this.operator);
    }

    /** Check condition use property as value */
    isPropertyValue() {
        return ImportCondition.isPropertyValueFlag(this.flags);
    }

    /** Return array of operators available for current type of field */
    getAvailOperators() {
        return ImportCondition.getAvailOperators(this.field_id);
    }

    /**
    * Apply operator of condition to specified data and return result
    * @param {number} leftVal - value on the left to operator
    * @param {number} rightVal - value on the right to operator
    */
    applyOperator(leftVal, rightVal) {
        if (typeof leftVal === 'undefined') {
            throw new Error('Invalid parameters');
        }

        const left = leftVal;
        const right = (typeof left === 'string') ? rightVal.toString() : rightVal;

        if (!(this.operator in ImportCondition.operatorsMap)) {
            throw new Error(`Unknown operator '${this.operator}'`);
        }

        const operatorFunction = ImportCondition.operatorsMap[this.operator];

        return operatorFunction(left, right);
    }

    /**
    * Return data value for field type of condition
    * @param {string} field - field name to check
    */
    getFieldValue(data) {
        return ImportCondition.getFieldValue(this.field_id, data);
    }

    /**
    * Check specified data is meet condition of condition
    * @param {string} field - field name to check
    */
    getConditionValue(data) {
        if (!isObject(data)) {
            throw new Error('Invalid transaction data');
        }

        if (this.isPropertyValue()) {
            return ImportCondition.getFieldValue(this.value, data);
        }
        if (this.isItemField()) {
            return parseInt(this.value, 10);
        }
        if (this.isAmountField()) {
            return parseFloat(this.value);
        }
        if (this.isDateField()) {
            return convDate(this.value);
        }

        return this.value;
    }

    /**
    * Check specified data is meet condition
    */
    meet(data) {
        if (!data) {
            throw new Error('Invalid parameters');
        }

        const fieldValue = this.getFieldValue(data);
        const conditionValue = this.getConditionValue(data);

        return this.applyOperator(fieldValue, conditionValue);
    }
}
