import { App } from '../../../Application/App.js';
import { cutTime } from '../../../utils/utils.js';
import { normalize } from '../../../utils/decimal.js';

import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
} from '../../../Models/Transaction.js';
import { INTERVAL_MONTH } from '../../../Models/ScheduledTransaction.js';

import {
    calculateSourceResult,
    calculateDestResult,
    updateStateExchange,
    getPersonAccount,
} from './reducer.js';
import * as STATE from './stateId.js';

/**
 *
 * @param {object} props
 * @returns {object}
 */
export const getInitialState = (props = {}) => {
    const accountModel = App.model.accounts;
    const currencyModel = App.model.currency;

    const isScheduleItem = props.type === 'scheduleItem';
    const transaction = { ...props.transaction };

    if (isScheduleItem) {
        transaction.start_date = cutTime(transaction.start_date);
        transaction.end_date = (transaction.end_date) ? cutTime(transaction.end_date) : null;
    } else {
        transaction.date = cutTime(transaction.date);
    }

    const res = {
        id: 0,
        type: props.type,
        transaction,
        form: {
            sourceAmount: '',
            destAmount: '',
            sourceResult: 0,
            fSourceResult: 0,
            destResult: 0,
            fDestResult: 0,
            exchange: 1,
            fExchange: 1,
            backExchange: 1,
            fBackExchange: 1,
            comment: transaction.comment,
            useBackExchange: false,
        },
        validation: {
            sourceAmount: true,
            destAmount: true,
            date: true,
            scheduleName: true,
            startDate: true,
            endDate: true,
            intervalStep: true,
        },
        srcAccount: accountModel.getItem(transaction.src_id),
        destAccount: accountModel.getItem(transaction.dest_id),
        srcCurrency: currencyModel.getItem(transaction.src_curr),
        destCurrency: currencyModel.getItem(transaction.dest_curr),
        isDiff: transaction.src_curr !== transaction.dest_curr,
        isUpdate: props.mode === 'update',
        isAvailable: props.isAvailable,
        submitStarted: false,
        renderTime: null,
    };

    if (isScheduleItem) {
        res.form.name = transaction.name;
        res.form.startDate = App.formatInputDate(transaction.start_date);
        res.form.endDate = (transaction.end_date)
            ? App.formatInputDate(transaction.end_date)
            : '';
        res.form.intervalStep = transaction.interval_step;
        res.form.intervalType = transaction.interval_type;
        res.form.intervalOffset = transaction.interval_offset;
    } else {
        res.form.date = App.formatInputDate(transaction.date);

        res.form.name = '';
        res.form.startDate = App.formatInputDate(transaction.date);
        res.form.endDate = '';
        res.form.intervalStep = 1;
        res.form.intervalType = INTERVAL_MONTH;
        res.form.intervalOffset = 0;
    }

    if (transaction.type === EXPENSE) {
        res.id = (res.isDiff) ? STATE.E_S_AMOUNT_D_AMOUNT : STATE.E_D_AMOUNT;
    } else if (transaction.type === INCOME) {
        res.id = (res.isDiff) ? STATE.I_S_AMOUNT_D_AMOUNT : STATE.I_S_AMOUNT;
    } else if (transaction.type === TRANSFER) {
        res.id = (res.isDiff) ? STATE.T_S_AMOUNT_D_AMOUNT : STATE.T_S_AMOUNT;
    } else if (transaction.type === DEBT) {
        res.person = App.model.persons.getItem(transaction.person_id);

        const personAccountCurr = (transaction.debtType)
            ? transaction.src_curr
            : transaction.dest_curr;

        const personAccountId = (transaction.debtType)
            ? transaction.src_id
            : transaction.dest_id;

        if (personAccountId) {
            res.personAccount = accountModel.getItem(personAccountId);
        } else {
            res.personAccount = getPersonAccount(transaction.person_id, personAccountCurr);
        }

        if (transaction.debtType) {
            res.srcAccount = res.personAccount;
            res.account = res.destAccount;

            if (res.isDiff) {
                res.id = STATE.DG_S_AMOUNT_D_AMOUNT;
            } else {
                res.id = (transaction.noAccount)
                    ? STATE.DG_NOACC_S_AMOUNT
                    : STATE.DG_S_AMOUNT;
            }
        } else {
            res.destAccount = res.personAccount;
            res.account = res.srcAccount;

            if (res.isDiff) {
                res.id = STATE.DT_S_AMOUNT_D_AMOUNT;
            } else {
                res.id = (transaction.noAccount)
                    ? STATE.DT_NOACC_D_AMOUNT
                    : STATE.DT_D_AMOUNT;
            }
        }
    } else if (transaction.type === LIMIT_CHANGE) {
        res.id = (isScheduleItem)
            ? STATE.L_AMOUNT
            : STATE.L_RESULT;

        if (transaction.src_id !== 0) {
            res.destAccount = res.srcAccount;
            res.srcAccount = null;
            res.destCurrency = res.srcCurrency;

            transaction.dest_id = transaction.src_id;
            transaction.src_id = 0;
            transaction.dest_curr = transaction.src_curr;
            transaction.src_amount = -transaction.src_amount;
            transaction.dest_amount = transaction.src_amount;
        }
    }

    res.form.sourceAmount = (transaction.src_amount)
        ? normalize(transaction.src_amount, res.srcCurrency.precision)
        : '';
    res.form.destAmount = (transaction.dest_amount)
        ? normalize(transaction.dest_amount, res.destCurrency.precision)
        : '';

    calculateSourceResult(res);
    calculateDestResult(res);
    updateStateExchange(res);

    return res;
};
