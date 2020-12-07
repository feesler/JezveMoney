import { App } from '../app.js';
import { Currency } from './currency.js';
import {
    fixDate,
    formatDate,
    setParam,
    copyObject,
    fixFloat,
} from '../common.js';
import {
    availTransTypes,
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from './transaction.js';

/* eslint-disable no-bitwise */

/** Rule field types */
const IMPORT_RULE_FIELD_MAIN_ACCOUNT = 1;
const IMPORT_RULE_FIELD_TPL = 2;
const IMPORT_RULE_FIELD_TR_AMOUNT = 3;
const IMPORT_RULE_FIELD_TR_CURRENCY = 4;
const IMPORT_RULE_FIELD_ACC_AMOUNT = 5;
const IMPORT_RULE_FIELD_ACC_CURRENCY = 6;
const IMPORT_RULE_FIELD_COMMENT = 7;
const IMPORT_RULE_FIELD_DATE = 8;
/** Rule operators */
const IMPORT_RULE_OP_STRING_INCLUDES = 1;
const IMPORT_RULE_OP_EQUAL = 2;
const IMPORT_RULE_OP_NOT_EQUAL = 3;
const IMPORT_RULE_OP_LESS = 4;
const IMPORT_RULE_OP_GREATER = 5;
/** Rule flags */
const IMPORT_RULE_OP_FIELD_FLAG = 0x01;

/** Action types */
const IMPORT_ACTION_SET_TR_TYPE = 1;
const IMPORT_ACTION_SET_ACCOUNT = 2;
const IMPORT_ACTION_SET_PERSON = 3;
const IMPORT_ACTION_SET_SRC_AMOUNT = 4;
const IMPORT_ACTION_SET_DEST_AMOUNT = 5;
const IMPORT_ACTION_SET_COMMENT = 6;

function amountFix(value) {
    const res = value.replace(/ /, '');
    return parseFloat(fixFloat(res));
}

function dateFromString(str) {
    let tmpDate = str;
    const pos = str.indexOf(' ');
    if (pos !== -1) {
        tmpDate = tmpDate.substr(0, pos);
    }

    const timestamp = fixDate(tmpDate);
    return new Date(timestamp);
}

function getColumn(row, colInd) {
    if (!Array.isArray(row)) {
        throw new Error('Invalid row');
    }

    const col = parseInt(colInd, 10);
    if (Number.isNaN(col) || col < 1 || col > row.length) {
        throw new Error(`Invalid column ${colInd}. Total columns: ${row.length}`);
    }

    return row[col - 1];
}

/** Change transaction type so source and destination are swapped */
function invertTransactionType(transaction) {
    const res = copyObject(transaction);

    if (transaction.type === EXPENSE) {
        res.type = INCOME;
        res.src_id = 0;
        res.dest_id = transaction.src_id;
        res.src_curr = transaction.dest_curr;
        res.dest_curr = transaction.src_curr;
    } else if (transaction.type === INCOME) {
        res.type = EXPENSE;
        res.src_id = transaction.dest_id;
        res.dest_id = 0;
        res.src_curr = transaction.dest_curr;
        res.dest_curr = transaction.src_curr;
    } else if (transaction.type === TRANSFER) {
        res.src_id = transaction.dest_id;
        res.dest_id = transaction.src_id;
        res.src_curr = transaction.dest_curr;
        res.dest_curr = transaction.src_curr;
    } else if (transaction.type === DEBT) {
        res.op = (transaction.op === 1) ? 2 : 1;
        res.src_curr = transaction.dest_curr;
        res.dest_curr = transaction.src_curr;
    }

    return res;
}

/** Convert import data to transaction object */
function fromImportData(data, mainAccount) {
    if (!data || !mainAccount) {
        throw new Error('Invalid data');
    }

    if (mainAccount.curr_id !== data.accCurr.id) {
        throw new Error(`Invalid currency ${data.accCurr.id} Expected ${mainAccount.curr_id}`);
    }

    const res = {
        enabled: true,
        mainAccount,
        type: (data.accAmountVal < 0) ? EXPENSE : INCOME,
        date: data.date,
        comment: data.comment,
        original: data,
    };

    if (res.type === EXPENSE) {
        res.src_id = mainAccount.id;
        res.dest_id = 0;
        res.src_amount = Math.abs(data.accAmountVal);
        res.dest_amount = Math.abs(data.trAmountVal);
        res.src_curr = data.accCurr.id;
        res.dest_curr = data.trCurr.id;
    } else {
        res.src_id = 0;
        res.dest_id = mainAccount.id;
        res.src_amount = Math.abs(data.trAmountVal);
        res.dest_amount = Math.abs(data.accAmountVal);
        res.src_curr = data.trCurr.id;
        res.dest_curr = data.accCurr.id;
    }

    return res;
}

export function applyTemplate(data, template, mainAccount) {
    const skipRows = 1;

    if (!Array.isArray(data) || !template || !mainAccount) {
        throw new Error('Invalid parameters');
    }

    const res = [];
    data.forEach((row, ind) => {
        if (ind < skipRows) {
            return;
        }

        const original = { mainAccount };

        const accAmount = getColumn(row, template.accountAmountColumn);
        original.accAmountVal = amountFix(accAmount);
        if (!original.accAmountVal) {
            return;
        }
        original.accCurrVal = getColumn(row, template.accountCurrColumn);
        original.accCurr = Currency.findByName(original.accCurrVal);
        if (!original.accCurr) {
            console.log(`Currency ${original.accCurrVal} not found`);
            return;
        }

        const trAmount = getColumn(row, template.transactionAmountColumn);
        original.trAmountVal = amountFix(trAmount);
        if (!original.accAmountVal) {
            return;
        }
        original.trCurrVal = getColumn(row, template.transactionCurrColumn);
        original.trCurr = Currency.findByName(original.trCurrVal);
        if (!original.trCurr) {
            console.log(`Currency ${original.trCurrVal} not found`);
            return;
        }

        original.date = dateFromString(getColumn(row, template.dateColumn));
        original.date = formatDate(original.date);

        original.comment = getColumn(row, template.commentColumn);

        const item = fromImportData(original, mainAccount);

        res.push(item);
    });

    return res;
}

/** Return actions of specified rule */
function getRuleActions(actions, ruleId) {
    if (!Array.isArray(actions)) {
        throw new Error('Invalid list of actions');
    }
    const id = parseInt(ruleId, 10);
    if (!id) {
        throw new Error(`Invalid rule id: ${ruleId}`);
    }

    return actions.filter((item) => item.rule_id === id);
}

function applyAction(transaction, action) {
    if (!transaction || !action) {
        throw new Error('Invalid parameters');
    }

    let res = copyObject(transaction);

    if (action.action_id === IMPORT_ACTION_SET_TR_TYPE) {
        const type = parseInt(action.value, 10);

        if (!availTransTypes.includes(type)) {
            throw new Error('Invalid transaction type value');
        }

        if (type === EXPENSE) {
            setParam(res, {
                src_id: res.mainAccount.id,
                dest_id: 0,
                src_amount: res.accAmountVal,
                dest_amount: res.trAmountVal,
                src_curr: res.accCurr.id,
                dest_curr: res.trCurr.id,
            });
        } else if (type === INCOME) {
            setParam(res, {
                src_id: 0,
                dest_id: res.mainAccount.id,
                src_amount: res.trAmountVal,
                dest_amount: res.accAmountVal,
                src_curr: res.trCurr.id,
                dest_curr: res.accCurr.id,
            });
        } else if (type === TRANSFER) {
            const accountId = App.state.accounts.getNext(res.mainAccount.id);
            const nextAccount = App.state.accounts.getItem(accountId);
            if (!nextAccount) {
                throw new Error('Failed to find next account');
            }

            setParam(res, {
                src_id: res.mainAccount.id,
                dest_id: nextAccount.id,
                src_amount: res.accAmountVal,
                dest_amount: res.trAmountVal,
                src_curr: res.accCurr.id,
                dest_curr: nextAccount.curr_id,
            });
        } else if (type === DEBT) {
            const personIds = App.state.getPersonsByIndexes(0);
            if (!Array.isArray(personIds) || !personIds.length) {
                throw new Error('Failed to find person');
            }
            const person = App.state.persons.getItem(personIds[0]);
            if (!person) {
                throw new Error('Failed to find person');
            }

            setParam(res, {
                person_id: person.id,
                acc_id: res.mainAccount.id,
                op: 2,
                src_amount: res.accAmountVal,
                dest_amount: res.trAmountVal,
                src_curr: res.accCurr.id,
                dest_curr: res.accCurr.id,
            });
        }

        res.type = type;
    } else if (action.action_id === IMPORT_ACTION_SET_ACCOUNT) {
        if (res.type !== TRANSFER) {
            throw new Error(`Invalid transaction type to set second account: ${res.type}`);
        }
        const account = App.state.accounts.getItem(action.value);
        if (!account) {
            throw new Error(`Account not found: ${action.value}`);
        }

        res.dest_id = account.id;
        res.dest_curr = account.curr_id;
        if (res.src_curr === res.dest_curr) {
            res.dest_amount = res.src_amount;
        }
    } else if (action.action_id === IMPORT_ACTION_SET_PERSON) {
        if (res.type !== TRANSFER) {
            throw new Error(`Invalid transaction type to set person: ${res.type}`);
        }
        const person = App.state.persons.getItem(action.value);
        if (!person) {
            throw new Error(`Person not found: ${action.value}`);
        }

        res.person_id = person.id;
    } else if (action.action_id === IMPORT_ACTION_SET_SRC_AMOUNT) {
        const amount = parseFloat(fixFloat(action.value));
        if (Number.isNaN(amount)) {
            throw new Error('Invalid amount value');
        }

        if (amount < 0) {
            res = invertTransactionType(res);
        }

        const absAmount = Math.abs(amount);
        if (res.type === INCOME) {
            res.dest_amount = absAmount;
        } else {
            res.src_amount = absAmount;
        }
    } else if (action.action_id === IMPORT_ACTION_SET_DEST_AMOUNT) {
        const amount = parseFloat(fixFloat(action.value));
        if (Number.isNaN(amount)) {
            throw new Error('Invalid amount value');
        }

        res.dest_amount = Math.abs(amount);
    } else if (action.action_id === IMPORT_ACTION_SET_COMMENT) {
        res.comment = action.value;
    } else {
        throw new Error('Invalid action');
    }

    return res;
}

/**
 * Return data value for specified field type
 * @param {Object} transaction - import transaction data
 * @param {Number} fieldId - field type to check
 */
function getFieldValue(transaction, fieldId) {
    if (!transaction || !transaction.original) {
        throw new Error('Invalid transaction data');
    }

    const field = parseInt(fieldId, 10);
    if (!field) {
        throw new Error(`Invalid field id: ${fieldId}`);
    }
    const data = transaction.original;

    if (field === IMPORT_RULE_FIELD_MAIN_ACCOUNT) {
        throw new Error('Main account field not implemented yet');
    }
    if (field === IMPORT_RULE_FIELD_TPL) {
        throw new Error('Template field not implemented yet');
    }
    if (field === IMPORT_RULE_FIELD_TR_AMOUNT) {
        return data.trAmountVal;
    }
    if (field === IMPORT_RULE_FIELD_TR_CURRENCY) {
        return data.trCurrVal;
    }
    if (field === IMPORT_RULE_FIELD_ACC_AMOUNT) {
        return data.accAmountVal;
    }
    if (field === IMPORT_RULE_FIELD_ACC_CURRENCY) {
        return data.accCurrVal;
    }
    if (field === IMPORT_RULE_FIELD_COMMENT) {
        return data.comment;
    }
    if (field === IMPORT_RULE_FIELD_DATE) {
        return data.date;
    }

    throw new Error(`Invalid field id: ${field}`);
}

function getConditionValue(transaction, rule) {
    if (!transaction || !rule) {
        throw new Error('Invalid parameters');
    }

    if ((rule.flags & IMPORT_RULE_OP_FIELD_FLAG) === IMPORT_RULE_OP_FIELD_FLAG) {
        return getFieldValue(transaction, rule.value);
    }

    return rule.value;
}

/**
 * Apply operator of rule to specified data and return result
 * @param {Object} rule - import rule object
 * @param {number} leftVal - value on the left to operator
 * @param {number} rightVal - value on the right to operator
 */
function applyOperator(rule, leftVal, rightVal) {
    if (!rule || typeof leftVal === 'undefined') {
        throw new Error('Invalid parameters');
    }

    const left = leftVal;
    const right = (typeof left === 'string') ? rightVal.toString() : rightVal;

    if (rule.operator === IMPORT_RULE_OP_STRING_INCLUDES) {
        return left.includes(right);
    }
    if (rule.operator === IMPORT_RULE_OP_EQUAL) {
        return left === right;
    }
    if (rule.operator === IMPORT_RULE_OP_NOT_EQUAL) {
        return left !== right;
    }
    if (rule.operator === IMPORT_RULE_OP_LESS) {
        return left < right;
    }
    if (rule.operator === IMPORT_RULE_OP_GREATER) {
        return left > right;
    }

    throw new Error('Invalid operator');
}

export function getChildRules(rules, ruleId) {
    if (!Array.isArray(rules)) {
        throw new Error('Invalid list of rules');
    }

    const id = parseInt(ruleId, 10);
    if (Number.isNaN(id)) {
        throw new Error(`Invalid rule id: ${ruleId}`);
    }

    return rules.filter((item) => item.parent_id === id);
}

/**
 * Check specified data is meet condition of rule
 */
function ruleMatch(transaction, rule) {
    if (!transaction || !rule) {
        throw new Error('Invalid parameters');
    }

    const fieldValue = getFieldValue(transaction, rule.field_id);
    const conditionValue = getConditionValue(transaction, rule);

    return applyOperator(rule, fieldValue, conditionValue);
}

export function applyRules(transaction, rules, allRules, allActions) {
    if (!transaction) {
        throw new Error('Invalid transaction object');
    }
    if (!Array.isArray(rules)) {
        throw new Error('Invalid rules');
    }
    if (!Array.isArray(allRules)) {
        throw new Error('Invalid all rules');
    }
    if (!Array.isArray(allActions)) {
        throw new Error('Invalid all actions');
    }

    let res = transaction;

    rules.forEach((rule) => {
        if (!ruleMatch(res, rule)) {
            return;
        }

        // Run actions of matched rule
        const ruleActions = getRuleActions(allActions, rule.id);
        res = ruleActions.reduce((data, act) => applyAction(data, act), res);

        // Check child rules
        const childRules = getChildRules(allRules, rule.id);
        res = applyRules(res, childRules, allRules, allActions);
    });

    return res;
}
