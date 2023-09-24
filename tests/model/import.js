import { assert, formatDate } from 'jezve-test';
import { createCSV } from '../common.js';
import { App } from '../Application.js';
import { REMINDER_SCHEDULED } from './Reminder.js';
import { ImportTransaction } from './ImportTransaction.js';

/** Returns data formatted in 'ru' locale */
const formatRuCsvDate = (date) => (
    formatDate(date, {
        locales: 'ru',
        options: App.dateFormatOptions,
    })
);

/** Returns data formatted in 'en' locale */
const formatEnCsvDate = (date) => (
    formatDate(date, {
        locales: 'en',
        options: App.dateFormatOptions,
    })
);

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
        `${formatRuCsvDate(date)} 00:00`,
        `${formatRuCsvDate(confirmDate)} 00:00`,
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
        `${formatRuCsvDate(date)} 00:00`,
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

/** Convert data array to import statement row */
function createEnLocaleTransaction(data) {
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
        `${formatEnCsvDate(date)} 00:00`,
        comment,
        trCurr,
        trAmount,
        accCurr,
        accAmount,
    ];
}

/** Convert transactions data array to CSV */
export function generateEnLocaleCSV(data) {
    const header = [
        'Transaction date',
        'Description',
        'Transaction currency',
        'Amount in transaction currency',
        'Account currency',
        'Amount in account currency',
    ];

    assert.isArray(data, 'Invalid data');

    const rows = data.map((item) => createEnLocaleTransaction(item));

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

/** Returns precision of specified currency */
export const getCurrencyPrecision = (id) => {
    const currency = App.currency.getItem(id);
    assert(currency, `Invalid currency id: ${id}`);

    return currency.precision;
};

/** Returns true if specified reminder is suitable for transaction */
const isSuitableReminder = (item, reminder) => {
    if (!item || reminder?.state !== REMINDER_SCHEDULED) {
        return false;
    }

    // Check date, source and destination accounts
    const type = (typeof item.type === 'string')
        ? ImportTransaction.typeFromString(item.type)
        : item.type;
    if (
        type !== reminder.type
        || item.src_id !== reminder.src_id
        || item.dest_id !== reminder.dest_id
        || item.date !== reminder.date
    ) {
        return false;
    }

    // Check amounts
    // Source and destination amount can be swapped
    const refSrcAmount = Math.abs(reminder.src_amount);
    const refDestAmount = Math.abs(reminder.dest_amount);
    if (
        (item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
        || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)
    ) {
        return false;
    }

    return true;
};

/** Returns first suitable reminder for specified transaction */
export const findSuitableReminder = (transaction, reminders) => (
    reminders.find((item) => (
        item
        && !item.picked
        && isSuitableReminder(transaction, item)
    )) ?? null
);
