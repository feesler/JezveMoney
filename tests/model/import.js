import { assert, formatDate } from 'jezve-test';
import { createCSV } from '../common.js';
import { App } from '../Application.js';

/** Convert data array to import statement row */
function createCardTransaction(data) {
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

    assert.isDate(date, 'Invalid date object');

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
export function generateCardCSV(data) {
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

    assert.isArray(data, 'Invalid data');

    const rows = data.map((item) => createCardTransaction(item));

    return createCSV({ header, data: rows });
}

/** Convert data array to import statement row */
function createAccountTransaction(data) {
    const [
        date,
        comment,
        trCurr,
        trAmount,
        accCurr = trCurr,
        accAmount = trAmount,
    ] = data;

    assert.isDate(date, 'Invalid date object');

    return [
        `${formatDate(date)} 00:00`,
        comment,
        trCurr,
        trAmount,
        accCurr,
        accAmount,
    ];
}

/** Convert transactions data array to CSV */
export function generateAccountCSV(data) {
    const header = [
        'Transaction date',
        'Description',
        'Transaction currency',
        'Amount in transaction currency',
        'Account currency',
        'Amount in account currency',
    ];

    assert.isArray(data, 'Invalid data');

    const rows = data.map((item) => createAccountTransaction(item));

    return createCSV({ header, data: rows });
}

/**
 * Check specified transaction have same proporties as reference
 * @param {Object} item - transaction object from API
 * @param {Object} reference - transaction item to compare
 */
function isSimilarTransaction(item, reference) {
    assert(item && reference, 'Invalid parameters');

    // Check date, source and destination accounts
    if (item.src_id !== reference.src_id
        || item.dest_id !== reference.dest_id
        || item.date !== reference.date) {
        return false;
    }

    // Check amounts
    // Source and destination amount can be swapped
    const refSrcAmount = Math.abs(reference.src_amount);
    const refDestAmount = Math.abs(reference.dest_amount);
    if ((item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
        || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)) {
        return false;
    }

    return true;
}

/** Search for transaction with same amounts, date and accounts */
export function findSimilarTransaction(transaction, skipList) {
    assert(transaction?.mainAccount?.id, 'Invalid transaction');

    const res = App.state.transactions.find((item) => (
        [item.src_id, item.dest_id].includes(transaction.mainAccount.id)
        && !skipList.includes(item.id)
        && isSimilarTransaction(item, transaction)
    ));

    return res;
}
