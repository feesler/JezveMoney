import { assert } from 'jezve-test';
import { App } from '../Application.js';

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

        assert(type && (type in typesMap), `Unknown transaction type ${type}`);

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

        assert(params?.type && (params.type in extractMap), 'Invalid data specified');

        const extractor = extractMap[params.type];
        const res = extractor(params, state);
        if (!res.date) {
            res.date = App.dates.now;
        }
        if (typeof res.category_id === 'undefined') {
            res.category_id = 0;
        }
        if (!res.comment) {
            res.comment = '';
        }

        return res;
    }

    static expense(params, state) {
        const res = {
            ...params,
            type: EXPENSE,
        };

        if (!('dest_id' in res)) {
            res.dest_id = 0;
        }
        if (!('dest_amount' in res)) {
            res.dest_amount = res.src_amount;
        }

        const acc = state.accounts.getItem(res.src_id);
        if (acc) {
            res.src_curr = acc.curr_id;
        }

        if (!('dest_curr' in res)) {
            res.dest_curr = res.src_curr;
        }

        return res;
    }

    static income(params, state) {
        const res = {
            ...params,
            type: INCOME,
        };

        if (!('src_id' in res)) {
            res.src_id = 0;
        }
        if (!('src_amount' in res)) {
            res.src_amount = res.dest_amount;
        }

        const acc = state.accounts.getItem(res.dest_id);
        if (acc) {
            res.dest_curr = acc.curr_id;
        }

        if (!('src_curr' in res)) {
            res.src_curr = res.dest_curr;
        }

        return res;
    }

    static transfer(params, state) {
        const res = {
            ...params,
            type: TRANSFER,
        };

        if (!('dest_amount' in res)) {
            res.dest_amount = res.src_amount;
        }

        const srcAcc = state.accounts.getItem(res.src_id);
        if (srcAcc) {
            res.src_curr = srcAcc.curr_id;
        }

        const destAcc = state.accounts.getItem(res.dest_id);
        if (destAcc) {
            res.dest_curr = destAcc.curr_id;
        }

        if (!('src_curr' in res)) {
            res.src_curr = res.dest_curr;
        }

        return res;
    }

    static debt(params, state) {
        const res = {
            ...params,
            type: DEBT,
        };

        if (!('dest_amount' in res)) {
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
