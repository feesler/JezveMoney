import { assert } from 'jezve-test';
import {
    DEBT,
    EXPENSE,
    INCOME,
    LIMIT_CHANGE,
    TRANSFER,
    Transaction,
} from './Transaction.js';
import {
    cutDate,
    getLastDayOfMonth,
    secondsToTime,
    shiftDate,
} from '../common.js';

/** Types of transactions */
export const INTERVAL_NONE = 0;
export const INTERVAL_DAY = 1;
export const INTERVAL_WEEK = 2;
export const INTERVAL_MONTH = 3;
export const INTERVAL_YEAR = 4;

const DAYS_IN_WEEK = 7;
const MAX_DAYS_IN_MONTH = 31;
const MAX_DAYS_IN_YEAR = 366;

/** Scheduled transaction item */
export class ScheduledTransaction {
    static availProps = [
        'type',
        'src_id',
        'dest_id',
        'src_amount',
        'dest_amount',
        'src_curr',
        'dest_curr',
        'category_id',
        'comment',
        'start_date',
        'end_date',
        'interval_type',
        'interval_step',
        'interval_offset',
    ];

    static availIntervals = [
        INTERVAL_NONE,
        INTERVAL_DAY,
        INTERVAL_WEEK,
        INTERVAL_MONTH,
        INTERVAL_YEAR,
    ];

    static defaultProps = {
        category_id: 0,
        comment: '',
    };

    static isValidIntervalType(value) {
        const interval = parseInt(value, 10);
        return this.availIntervals.includes(interval);
    }

    static isValidIntervalStep(value) {
        const steps = parseInt(value, 10);
        return steps >= 0;
    }

    static isValidIntervalOffset(value, intervalType) {
        if (!this.isValidIntervalType(intervalType)) {
            return false;
        }

        const offset = parseInt(value, 10);
        const type = parseInt(intervalType, 10);
        return (
            (type === INTERVAL_NONE && offset === 0)
            || (type === INTERVAL_DAY && offset === 0)
            || (type === INTERVAL_WEEK && offset >= 0 && offset < DAYS_IN_WEEK)
            || (type === INTERVAL_MONTH && offset >= 0 && offset < MAX_DAYS_IN_MONTH)
            || (type === INTERVAL_YEAR && offset >= 0 && offset < MAX_DAYS_IN_YEAR)
        );
    }

    /** Converts short scheduled transaction declaration to full object */
    static extract(params, state) {
        const extractMap = {
            [EXPENSE]: this.expense,
            [INCOME]: this.income,
            [TRANSFER]: this.transfer,
            [DEBT]: this.debt,
            [LIMIT_CHANGE]: this.limitChange,
        };

        assert(params?.type && (params.type in extractMap), 'Invalid data specified');

        const extractor = extractMap[params.type];
        const res = extractor(params, state);

        return {
            ...this.defaultProps,
            ...res,
        };
    }

    static expense(params, state) {
        return Transaction.expense(params, state);
    }

    static income(params, state) {
        return Transaction.income(params, state);
    }

    static transfer(params, state) {
        return Transaction.transfer(params, state);
    }

    static debt(params, state) {
        const res = {
            ...params,
            type: DEBT,
        };

        const srcAcc = state.accounts.getItem(res.src_id);
        const destAcc = state.accounts.getItem(res.dest_id);

        if (srcAcc && srcAcc.owner_id !== state.profile.owner_id) {
            if (!('src_curr' in res)) {
                res.src_curr = srcAcc.curr_id;
            }

            if (!('dest_curr' in res)) {
                res.dest_curr = destAcc?.curr_id ?? res.src_curr;
            }

            if (!('dest_amount' in res)) {
                res.dest_amount = res.src_amount;
            }

            if (!destAcc) {
                res.dest_id = 0;
            }
        } else if (destAcc && destAcc.owner_id !== state.profile.owner_id) {
            if (!('dest_curr' in res)) {
                res.dest_curr = destAcc.curr_id;
            }

            if (!('src_curr' in res)) {
                res.src_curr = srcAcc?.curr_id ?? res.dest_curr;
            }

            if (!('src_amount' in res)) {
                res.src_amount = res.dest_amount;
            }

            if (!srcAcc) {
                res.src_id = 0;
            }
        }

        return res;
    }

    static limitChange(params, state) {
        return Transaction.limitChange(params, state);
    }

    constructor(props) {
        assert.isObject(props, 'Invalid props');

        if (props.id) {
            this.id = props.id;
        }

        ScheduledTransaction.availProps.forEach((propName) => {
            assert(propName in props, `Property '${propName}' not found.`);

            this[propName] = props[propName];
        });
    }

    getFirstInterval() {
        return secondsToTime(this.start_date);
    }

    getNextInterval(timestamp) {
        const endDate = this.end_date ? secondsToTime(this.end_date) : null;

        if (
            (this.interval_type === INTERVAL_NONE)
            || (this.interval_step === 0)
            || (endDate && endDate < timestamp)
        ) {
            return null;
        }

        const date = new Date(timestamp);
        let res;

        if (this.interval_type === INTERVAL_DAY) {
            const targetDate = shiftDate(date, this.interval_step);
            res = targetDate.getTime();
        } else if (this.interval_type === INTERVAL_WEEK) {
            const targetWeek = shiftDate(date, this.interval_step * DAYS_IN_WEEK);
            res = targetWeek.getTime();
        } else if (this.interval_type === INTERVAL_MONTH) {
            const startDate = new Date(this.getFirstInterval());
            const targetMonth = new Date(Date.UTC(
                date.getFullYear(),
                date.getMonth() + this.interval_step,
                1,
            ));
            const maxDate = getLastDayOfMonth(targetMonth);

            res = Date.UTC(
                date.getFullYear(),
                date.getMonth() + this.interval_step,
                Math.min(startDate.getDate(), maxDate.getDate()),
            );
        } else if (this.interval_type === INTERVAL_YEAR) {
            res = Date.UTC(
                date.getFullYear() + this.interval_step,
                date.getMonth(),
                date.getDate(),
            );
        } else {
            throw new Error('Invalid type of interval');
        }

        return (endDate && endDate < res) ? null : res;
    }

    getReminderDate(timestamp) {
        let res = new Date(cutDate(new Date(timestamp)));

        if (
            this.interval_type !== INTERVAL_NONE
            && this.interval_offset > 0
        ) {
            res = shiftDate(res, this.interval_offset);
        }

        return res.getTime();
    }

    getReminders(options = {}) {
        const {
            limit = 100,
            endDate = Date.now(),
        } = options;

        const res = [];
        let interval = this.getFirstInterval();
        while (interval && (limit === 0 || res.length < limit) && interval < endDate) {
            const date = this.getReminderDate(interval);
            if (date > endDate) {
                break;
            }

            res.push(date);
            interval = this.getNextInterval(interval);
        }

        return res;
    }
}
