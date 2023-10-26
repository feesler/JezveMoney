import { assert } from '@jezvejs/assert';
import { App } from '../Application.js';
import { __ } from './locale.js';

/** Types of transactions */
export const EXPENSE = 1;
export const INCOME = 2;
export const TRANSFER = 3;
export const DEBT = 4;
export const LIMIT_CHANGE = 5;

export class Transaction {
    static availProps = [
        'type',
        'src_id',
        'dest_id',
        'src_amount',
        'dest_amount',
        'src_curr',
        'dest_curr',
        'date',
        'category_id',
        'comment',
    ];

    static debtProps = [
        'type',
        'person_id',
        'acc_id',
        'op',
        'src_amount',
        'dest_amount',
        'src_curr',
        'dest_curr',
        'date',
        'category_id',
        'comment',
    ];

    static get defaultProps() {
        return {
            date: App.datesSec.now,
            category_id: 0,
            comment: '',
        };
    }

    static availTypes = [EXPENSE, INCOME, TRANSFER, DEBT, LIMIT_CHANGE];

    static basicTypes = [EXPENSE, INCOME, TRANSFER, DEBT];

    /** Returns name string for specified type of transaction */
    static getTypeName(type) {
        const typesMap = {
            [EXPENSE]: 'expense',
            [INCOME]: 'income',
            [TRANSFER]: 'transfer',
            [DEBT]: 'debt',
            [LIMIT_CHANGE]: 'limit',
        };

        assert(type && (type in typesMap), `Unknown transaction type ${type}`);

        return typesMap[type];
    }

    /** Returns localized string for specified type of transaction */
    static typeToString(type, locale = App.view.locale) {
        const typesMap = {
            [EXPENSE]: 'transactions.types.expense',
            [INCOME]: 'transactions.types.income',
            [TRANSFER]: 'transactions.types.transfer',
            [DEBT]: 'transactions.types.debt',
            [LIMIT_CHANGE]: 'transactions.types.creditLimit',
        };

        assert(type && (type in typesMap), `Unknown transaction type ${type}`);

        return __(typesMap[type], locale);
    }

    static strToType(str) {
        const strToType = {
            ALL: 0,
            EXPENSE,
            INCOME,
            TRANSFER,
            DEBT,
            LIMIT_CHANGE,
        };

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
            [LIMIT_CHANGE]: Transaction.limitChange,
        };

        assert(params?.type && (params.type in extractMap), 'Invalid data specified');

        const extractor = extractMap[params.type];
        const res = extractor(params, state);
        if (!res.date) {
            res.date = App.datesSec.now;
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

        const acc = (res.acc_id) ? state.accounts.getItem(res.acc_id) : null;
        res.acc_id = (acc) ? acc.id : 0;

        if (res.op === 1) {
            if (!('dest_curr' in res)) {
                res.dest_curr = (acc) ? acc.curr_id : res.src_curr;
            }
            if (!('src_curr' in res)) {
                res.src_curr = res.dest_curr;
            }

            if (!('dest_amount' in res)) {
                res.dest_amount = res.src_amount;
            }
        } else {
            if (!('src_curr' in res)) {
                res.src_curr = (acc) ? acc.curr_id : res.dest_curr;
            }
            if (!('dest_curr' in res)) {
                res.dest_curr = res.src_curr;
            }

            if (!('src_amount' in res)) {
                res.src_amount = res.dest_amount;
            }
        }

        return res;
    }

    static limitChange(params, state) {
        const res = {
            ...params,
            type: LIMIT_CHANGE,
        };

        if (!('src_id' in res)) {
            res.src_id = 0;
        }
        if (!('src_amount' in res)) {
            res.src_amount = res.dest_amount;
        }

        const accountId = (res.src_id) ? res.src_id : res.dest_id;
        const acc = state.accounts.getItem(accountId);
        if (acc) {
            res.src_curr = acc.curr_id;
            res.dest_curr = acc.curr_id;
        }

        if (!('src_curr' in res)) {
            res.src_curr = res.dest_curr;
        }

        return res;
    }
}
