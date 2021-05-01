import {
    isDate,
    formatDate,
} from 'jezve-test';
import {
    createCSV,
} from '../common.js';

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
