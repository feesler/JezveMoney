import { Currency } from './currency.js';
import {
    isDate,
    fixDate,
    formatDate,
    fixFloat,
    createCSV,
} from '../common.js';
import { ImportTransaction } from './importtransaction.js';

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

        const item = ImportTransaction.fromImportData(original, mainAccount);

        res.push(item);
    });

    return res;
}
