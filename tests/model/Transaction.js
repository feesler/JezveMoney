import { copyObject, assert } from 'jezve-test';
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
        if (!res.comment) {
            res.comment = '';
        }

        return res;
    }

    static expense(params, state) {
        assert(params.src_id, 'Source account not specified');

        const res = copyObject(params);

        res.type = EXPENSE;
        res.dest_id = 0;

        if (!res.dest_amount) {
            res.dest_amount = res.src_amount;
        }

        const acc = state.accounts.getItem(res.src_id);
        assert(acc, 'Account not found');
        res.src_curr = acc.curr_id;

        if (!res.dest_curr) {
            res.dest_curr = res.src_curr;
        }

        return res;
    }

    static income(params, state) {
        assert(params.dest_id, 'Destination account not specified');

        const res = copyObject(params);

        res.type = INCOME;
        res.src_id = 0;

        if (!res.src_amount) {
            res.src_amount = res.dest_amount;
        }

        const acc = state.accounts.getItem(res.dest_id);
        assert(acc, 'Account not found');
        res.dest_curr = acc.curr_id;

        if (!res.src_curr) {
            res.src_curr = res.dest_curr;
        }

        return res;
    }

    static transfer(params, state) {
        assert(params.src_id, 'Source account not specified');
        assert(params.dest_id, 'Destination account not specified');

        const res = copyObject(params);

        res.type = TRANSFER;

        if (!res.dest_amount) {
            res.dest_amount = res.src_amount;
        }

        const srcAcc = state.accounts.getItem(res.src_id);
        assert(srcAcc, 'Account not found');
        res.src_curr = srcAcc.curr_id;

        const destAcc = state.accounts.getItem(res.dest_id);
        assert(destAcc, 'Account not found');
        res.dest_curr = destAcc.curr_id;

        if (!res.src_curr) {
            res.src_curr = res.dest_curr;
        }

        return res;
    }

    static debt(params, state) {
        assert(params.person_id, 'Person not specified');

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
