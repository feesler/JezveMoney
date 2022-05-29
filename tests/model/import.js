import { isDate } from 'jezvejs';
import { formatDate } from 'jezvejs/DateUtils';
import { createCSV } from '../common.js';
import { App } from '../Application.js';

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

/**
 * Check specified transaction have same proporties as reference
 * @param {Object} item - transaction object from API
 * @param {Object} reference - transaction item to compare
 */
function isSimilarTransaction(item, reference) {
    if (!item || !reference) {
        throw new Error('Invalid parameters');
    }

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
    if (
        !transaction
        || !transaction.mainAccount
        || !transaction.mainAccount.id
    ) {
        throw new Error('Invalid transaction');
    }

    const res = App.state.transactions.find((item) => (
        [item.src_id, item.dest_id].includes(transaction.mainAccount.id)
        && !skipList.includes(item.id)
        && isSimilarTransaction(item, transaction)
    ));

    return res;
}
