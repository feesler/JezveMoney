import { App } from '../app.js';
import { List } from './list.js';
import { Currency } from './currency.js';
import { ImportRule } from './importrule.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_SRC_AMOUNT,
    IMPORT_ACTION_SET_DEST_AMOUNT,
    IMPORT_ACTION_SET_COMMENT,
} from './importaction.js';
import {
    isDate,
    fixDate,
    formatDate,
    setParam,
    copyObject,
    fixFloat,
    createCSV,
} from '../common.js';
import {
    availTransTypes,
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from './transaction.js';

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

/** Convert data array to import statement row */
function createDummyTransaction(data) {
    const [
        date,
        comment,
        city,
        country,
        trCurr,
        trAmount,
        accCurr = trCurr,
        accAmount = trAmount,
    ] = data;

    if (!isDate(date)) {
        throw new Error('Invalid date object');
    }

    const confirmDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3);

    return [
        `${formatDate(date)} 00:00`,
        `${formatDate(confirmDate)} 00:00`,
        '*7777',
        `${comment} ${city} ${country}`,
        comment,
        city,
        country,
        trCurr,
        trAmount,
        accCurr,
        accAmount,
    ];
}

/** Convert transactions data array to CSV */
export function generateCSV(data) {
    const header = [
        'Transaction date',
        'Posting date',
        'Card',
        'Description',
        'Merchant',
        'City',
        'Country',
        'Transaction currency',
        'Amount in transaction currency',
        'Account currency',
        'Amount in account currency',
    ];

    if (!Array.isArray(data)) {
        throw new Error('Invalid data');
    }

    const rows = data.map((item) => createDummyTransaction(item));

    return createCSV({ header, data: rows });
}

/** Extract specified column data from raw data row */
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

/**
 * Apply import template to raw data of uploaded file and return
 * @param {string[][]} data - raw data from uploaded file
 * @param {ImportTemplate} template - import template object
 * @param {Account} mainAccount - main account object
 */
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

        const accAmount = getColumn(row, template.columns.accountAmount);
        original.accAmountVal = amountFix(accAmount);
        if (!original.accAmountVal) {
            return;
        }
        original.accCurrVal = getColumn(row, template.columns.accountCurrency);
        original.accCurr = Currency.findByName(original.accCurrVal);
        if (!original.accCurr) {
            console.log(`Currency ${original.accCurrVal} not found`);
            return;
        }

        const trAmount = getColumn(row, template.columns.transactionAmount);
        original.trAmountVal = amountFix(trAmount);
        if (!original.accAmountVal) {
            return;
        }
        original.trCurrVal = getColumn(row, template.columns.transactionCurrency);
        original.trCurr = Currency.findByName(original.trCurrVal);
        if (!original.trCurr) {
            console.log(`Currency ${original.trCurrVal} not found`);
            return;
        }

        original.date = dateFromString(getColumn(row, template.columns.date));
        original.date = formatDate(original.date);

        original.comment = getColumn(row, template.columns.comment);

        const item = fromImportData(original, mainAccount);

        res.push(item);
    });

    return res;
}

/** Apply action to specified transaction and return result transaction */
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
 * Apply import rules to specified transaction and return result transaction
 * @param {Object} transaction - imported transaction object
 * @param {ImportRule[]} rules - array of import rules to apply
 */
export function applyRules(transaction, rules) {
    if (!transaction) {
        throw new Error('Invalid transaction object');
    }
    if (!(rules instanceof List)) {
        throw new Error('Invalid rules');
    }

    let res = transaction;

    for (const ruleData of rules.data) {
        const rule = new ImportRule(ruleData);

        if (!rule.meetConditions(transaction)) {
            continue;
        }

        // Run actions of matched rule
        res = rule.actions.reduce((data, act) => applyAction(data, act), res);
    }

    return res;
}
