import { copyObject } from '../common.js';
import { App } from '../app.js';

/** Types of transactions */
export const EXPENSE = 1;
export const INCOME = 2;
export const TRANSFER = 3;
export const DEBT = 4;

export const availTransTypes = [EXPENSE, INCOME, TRANSFER, DEBT];

export class Transaction {
    /** Return string for specified type of transaction */
    static typeToString(type) {
        const typesMap = {
            [EXPENSE]: 'Expense',
            [INCOME]: 'Income',
            [TRANSFER]: 'Transfer',
            [DEBT]: 'Debt',
        };

        if (!type || !(type in typesMap)) {
            throw new Error(`Unknown transaction type ${type}`);
        }

        return typesMap[type];
    }

    static strToType(str) {
        /* eslint-disable quote-props */
        const strToType = {
            'ALL': 0,
            'EXPENSE': EXPENSE,
            'INCOME': INCOME,
            'TRANSFER': TRANSFER,
            'DEBT': DEBT,
        };
        /* eslint-enable quote-props */

        if (!str) {
            return null;
        }

        const key = str.toUpperCase();
        return (key in strToType) ? strToType[key] : null;
    }

    // Try to convert specified short declaration of transaction to full object
    static extract(params, state) {
        const extractMap = {
            [EXPENSE]: Transaction.expense,
            [INCOME]: Transaction.income,
            [TRANSFER]: Transaction.transfer,
            [DEBT]: Transaction.debt,
        };

        if (!params || !params.type || !(params.type in extractMap)) {
            throw new Error('Invalid data specified');
        }

        const extractor = extractMap[params.type];
        const res = extractor(params, state);
        if (!res.date) {
            res.date = App.dates.now;
        }
        if (!res.comment) {
            res.comment = '';
        }

        return res;
    }

    static expense(params, state) {
        if (!params.src_id) {
            throw new Error('Source account not specified');
        }

        const res = copyObject(params);

        res.type = EXPENSE;
        res.dest_id = 0;

        if (!res.dest_amount) {
            res.dest_amount = res.src_amount;
        }

        const acc = state.accounts.getItem(res.src_id);
        if (!acc) {
            throw new Error('Account not found');
        }
        res.src_curr = acc.curr_id;

        if (!res.dest_curr) {
            res.dest_curr = res.src_curr;
        }

        return res;
    }

    static income(params, state) {
        if (!params.dest_id) {
            throw new Error('Destination account not specified');
        }

        const res = copyObject(params);

        res.type = INCOME;
        res.src_id = 0;

        if (!res.src_amount) {
            res.src_amount = res.dest_amount;
        }

        const acc = state.accounts.getItem(res.dest_id);
        if (!acc) {
            throw new Error('Account not found');
        }
        res.dest_curr = acc.curr_id;

        if (!res.src_curr) {
            res.src_curr = res.dest_curr;
        }

        return res;
    }

    static transfer(params, state) {
        if (!params.src_id) {
            throw new Error('Source account not specified');
        }
        if (!params.dest_id) {
            throw new Error('Destination account not specified');
        }

        const res = copyObject(params);

        res.type = TRANSFER;

        if (!res.dest_amount) {
            res.dest_amount = res.src_amount;
        }

        const srcAcc = state.accounts.getItem(res.src_id);
        if (!srcAcc) {
            throw new Error('Account not found');
        }
        res.src_curr = srcAcc.curr_id;

        const destAcc = state.accounts.getItem(res.dest_id);
        if (!destAcc) {
            throw new Error('Account not found');
        }
        res.dest_curr = destAcc.curr_id;

        if (!res.src_curr) {
            res.src_curr = res.dest_curr;
        }

        return res;
    }

    static debt(params, state) {
        if (!params.person_id) {
            throw new Error('Person not specified');
        }

        const res = copyObject(params);

        res.type = DEBT;

        if (!res.dest_amount) {
            res.dest_amount = res.src_amount;
        }

        const acc = res.acc_id ? state.accounts.getItem(res.acc_id) : null;
        if (acc) {
            res.src_curr = acc.curr_id;
            res.dest_curr = acc.curr_id;
        } else {
            res.acc_id = 0;
            res.src_curr = (res.src_curr || res.dest_curr);
            res.dest_curr = res.src_curr;
        }

        return res;
    }
}
