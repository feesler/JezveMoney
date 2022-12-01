import {
    isFunction,
    isObject,
    hasFlag,
    assert,
} from 'jezve-test';
import { App } from '../Application.js';
import { convDate, fixFloat } from '../common.js';

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

export const ConditionFields = {
    mainAccount: IMPORT_COND_FIELD_MAIN_ACCOUNT,
    template: IMPORT_COND_FIELD_TPL,
    transactionAmount: IMPORT_COND_FIELD_TR_AMOUNT,
    transactionCurrency: IMPORT_COND_FIELD_TR_CURRENCY,
    accountAmount: IMPORT_COND_FIELD_ACC_AMOUNT,
    accountCurrency: IMPORT_COND_FIELD_ACC_CURRENCY,
    comment: IMPORT_COND_FIELD_COMMENT,
    date: IMPORT_COND_FIELD_DATE,
};

export const ConditionOperators = {
    includes: IMPORT_COND_OP_STRING_INCLUDES,
    is: IMPORT_COND_OP_EQUAL,
    isNot: IMPORT_COND_OP_NOT_EQUAL,
    less: IMPORT_COND_OP_LESS,
    greater: IMPORT_COND_OP_GREATER,
};

/** Item field types */
const itemFields = [
    ConditionFields.mainAccount,
    ConditionFields.template,
    ConditionFields.transactionCurrency,
    ConditionFields.accountCurrency,
];

/** Amount field types */
const amountFields = [
    ConditionFields.transactionAmount,
    ConditionFields.accountAmount,
];

/** Currency field types */
const currencyFields = [
    ConditionFields.transactionCurrency,
    ConditionFields.accountCurrency,
];

const propConditionAvailFields = [
    ...amountFields,
    ...currencyFields,
];

/** Item(account, template, currency) operators */
const itemOperators = [
    ConditionOperators.is,
    ConditionOperators.isNot,
];

/** Numeric(amount and date) operators */
const numOperators = [
    ConditionOperators.is,
    ConditionOperators.isNot,
    ConditionOperators.less,
    ConditionOperators.greater,
];

/** String operators */
const stringOperators = [
    ConditionOperators.includes,
    ConditionOperators.is,
    ConditionOperators.isNot,
    ConditionOperators.less,
    ConditionOperators.greater,
];

/** List of available field types */
const fieldTypes = [
    { id: ConditionFields.mainAccount, title: 'Main account', operators: itemOperators },
    { id: ConditionFields.template, title: 'Template', operators: itemOperators },
    { id: ConditionFields.transactionAmount, title: 'Transaction amount', operators: numOperators },
    { id: ConditionFields.transactionCurrency, title: 'Transaction currency', operators: itemOperators },
    { id: ConditionFields.accountAmount, title: 'Account amount', operators: numOperators },
    { id: ConditionFields.accountCurrency, title: 'Account currency', operators: itemOperators },
    { id: ConditionFields.comment, title: 'Comment', operators: stringOperators },
    { id: ConditionFields.date, title: 'Date', operators: numOperators },
];

/** Field type to name map */
const fieldNames = {
    [ConditionFields.mainAccount]: 'mainAccount',
    [ConditionFields.template]: 'template',
    [ConditionFields.transactionAmount]: 'transactionAmount',
    [ConditionFields.transactionCurrency]: 'transactionCurrency',
    [ConditionFields.accountAmount]: 'accountAmount',
    [ConditionFields.accountCurrency]: 'accountCurrency',
    [ConditionFields.comment]: 'comment',
    [ConditionFields.date]: 'date',
};

/** Field type to data property name map */
const fieldsMap = {
    ...fieldNames,
    [ConditionFields.mainAccount]: (data) => data.mainAccount.id,
};

/** Operator functions map */
const operatorsMap = {
    [ConditionOperators.includes]: (left, right) => left.includes(right),
    [ConditionOperators.is]: (left, right) => left === right,
    [ConditionOperators.isNot]: (left, right) => left !== right,
    [ConditionOperators.less]: (left, right) => left < right,
    [ConditionOperators.greater]: (left, right) => left > right,
};

/** Operator type to name map */
const operatorNames = {
    [ConditionOperators.includes]: 'includes',
    [ConditionOperators.is]: 'is',
    [ConditionOperators.isNot]: 'isNot',
    [ConditionOperators.less]: 'less',
    [ConditionOperators.greater]: 'greater',
};

/** List of available condition operator types */
const operatorTypes = [
    { id: ConditionOperators.includes, title: 'contains' },
    { id: ConditionOperators.is, title: 'is' },
    { id: ConditionOperators.isNot, title: 'is not' },
    { id: ConditionOperators.less, title: 'less than' },
    { id: ConditionOperators.greater, title: 'greater than' },
];

/** Search condition field type by id */
const getFieldTypeById = (value) => {
    const id = parseInt(value, 10);
    assert(id, 'Invalid parameter');

    return fieldTypes.find((item) => item.id === id);
};

/** Returns import condition to compare field with value */
const valueCondition = (id, operator, value) => ({
    field_id: id,
    operator,
    value,
    flags: 0,
});

/** Returns import condition to compare field with another field */
const propCondition = (id, operator, value) => ({
    field_id: id,
    operator,
    value,
    flags: IMPORT_COND_OP_FIELD_FLAG,
});

const createFieldOperators = ({ id, operators }) => {
    const res = {};
    operators.forEach((operator) => {
        const name = operatorNames[operator];
        if (!res[name]) {
            res[name] = {};
        }

        res[name].value = (value) => valueCondition(id, operator, value);
        if (propConditionAvailFields.includes(id)) {
            res[name].prop = (value) => propCondition(id, operator, value);
        }
    });
    return res;
};

const createConditions = () => {
    const res = {};
    fieldTypes.forEach((fieldType) => {
        const name = fieldNames[fieldType.id];
        res[name] = createFieldOperators(fieldType);
    });
    return res;
};

export const conditions = createConditions();

/** Import condition model */
export class ImportCondition {
    /**
    * Return data value for specified field type
    * @param {string} field - field name to check
    */
    static getFieldValue(fieldId, data) {
        const field = parseInt(fieldId, 10);
        assert(field && (field in fieldsMap), `Invalid field id: ${fieldId}`);
        assert.isObject(data, 'Invalid transaction data');

        const mapper = fieldsMap[field];
        if (isFunction(mapper)) {
            return mapper(data);
        }

        return data[mapper];
    }

    /** Check value for specified field type is account */
    static isItemField(value) {
        return itemFields.includes(parseInt(value, 10));
    }

    /** Check value for specified field type is account */
    static isAccountField(value) {
        return parseInt(value, 10) === ConditionFields.mainAccount;
    }

    /** Check value for specified field type is template */
    static isTemplateField(value) {
        return parseInt(value, 10) === ConditionFields.template;
    }

    /** Check value for specified field type is currency */
    static isCurrencyField(value) {
        return currencyFields.includes(parseInt(value, 10));
    }

    /** Check value for specified field type is amount */
    static isAmountField(value) {
        return amountFields.includes(parseInt(value, 10));
    }

    /** Check value for specified field type is date */
    static isDateField(value) {
        return parseInt(value, 10) === ConditionFields.date;
    }

    /** Check value for specified field type is string */
    static isStringField(value) {
        return parseInt(value, 10) === ConditionFields.comment;
    }

    /** Search condition field type by id */
    static getFieldTypeById(value) {
        return getFieldTypeById(value);
    }

    /** Search condition field type by name (case insensitive) */
    static findFieldTypeByName(name) {
        assert.isString(name, 'Invalid parameter');

        const lcName = name.toLowerCase();
        return fieldTypes.find((item) => item.title.toLowerCase() === lcName);
    }

    /** Search condition operator by id */
    static getOperatorById(value) {
        const id = parseInt(value, 10);
        assert(id, 'Invalid parameter');

        return operatorTypes.find((item) => item.id === id);
    }

    /** Search condition operator by name (case insensitive) */
    static findOperatorByName(name) {
        assert.isString(name, 'Invalid parameter');

        const lcName = name.toLowerCase();
        return operatorTypes.find((item) => item.title.toLowerCase() === lcName);
    }

    /** Check specified value is item operator(equal or not equal) */
    static isItemOperator(value) {
        return itemOperators.includes(parseInt(value, 10));
    }

    /** Check specified value is numeric operator */
    static isNumOperator(value) {
        return numOperators.includes(parseInt(value, 10));
    }

    /** Check specified value is string operator */
    static isStringOperator(value) {
        return stringOperators.includes(parseInt(value, 10));
    }

    /** Check field value flag */
    static isPropertyValueFlag(value) {
        const flags = parseInt(value, 10);
        assert.isNumber(flags, 'Invalid flags value');

        return hasFlag(flags, IMPORT_COND_OP_FIELD_FLAG);
    }

    /** Returns true if possible to compare specified field type with another field */
    static isPropertyValueAvailable(value) {
        return propConditionAvailFields.includes(parseInt(value, 10));
    }

    constructor(data) {
        const requiredProps = ['field_id', 'operator', 'value', 'flags'];

        assert(data, 'Invalid data');

        requiredProps.forEach((propName) => {
            assert(propName in data, `Property '${propName}' not found.`);

            this[propName] = data[propName];
        });
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

    /** Validate condition amount value */
    isValidAmount(value) {
        const amount = parseFloat(fixFloat(value));
        return !Number.isNaN(amount);
    }

    /** Returns true if possible to compare current field type with another field */
    isPropertyValueAvailable() {
        return ImportCondition.isPropertyValueAvailable(this.field_id);
    }

    /** Check correctness of condition */
    validate() {
        // Check amount value
        if (this.isAmountField() && !this.isValidAmount(this.value)) {
            return false;
        }

        // Check date condition
        if (this.isDateField() && !convDate(this.value)) {
            return false;
        }

        // Check empty condition value is used only for string field
        // with 'equal' and 'not equal' operators
        if (this.value === '' && !(this.isStringField() && this.isItemOperator())) {
            return false;
        }

        if (this.isPropertyValue()) {
            // Check property value is available
            if (!this.isPropertyValueAvailable()) {
                return false;
            }

            // Check property is not compared with itself as property value
            if (this.field_id === parseInt(this.value, 10)) {
                return false;
            }
        }

        return true;
    }

    /**
    * Apply operator of condition to specified data and return result
    * @param {number} leftVal - value on the left to operator
    * @param {number} rightVal - value on the right to operator
    */
    applyOperator(leftVal, rightVal) {
        assert.isDefined(leftVal, 'Invalid parameters');

        const left = leftVal;
        const right = (typeof left === 'string') ? rightVal.toString() : rightVal;

        assert((this.operator in operatorsMap), `Unknown operator '${this.operator}'`);

        const operatorFunction = operatorsMap[this.operator];
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
        assert(isObject(data), 'Invalid transaction data');

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
        assert(data, 'Invalid parameters');

        const fieldValue = this.getFieldValue(data);
        const conditionValue = this.getConditionValue(data);

        return this.applyOperator(fieldValue, conditionValue);
    }

    /** Check condition match search filter */
    isMatchFilter(value) {
        const lower = value.toLowerCase();

        if (this.isTemplateField()) {
            const template = App.state.templates.getItem(this.value);
            if (!template) {
                return false;
            }

            return template.name.toLowerCase().includes(lower);
        }

        if (this.isAccountField()) {
            const account = App.state.accounts.getItem(this.value);
            if (!account) {
                return false;
            }

            return account.name.toLowerCase().includes(lower);
        }

        return this.value.toLowerCase().includes(lower);
    }
}
