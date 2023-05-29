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
    MONTHS_IN_YEAR,
    cutDate,
    getLastDayOfMonth,
    secondsToTime,
    shiftDate,
} from '../common.js';
import { __ } from './locale.js';
import { App } from '../Application.js';

/** Types of transactions */
export const INTERVAL_NONE = 0;
export const INTERVAL_DAY = 1;
export const INTERVAL_WEEK = 2;
export const INTERVAL_MONTH = 3;
export const INTERVAL_YEAR = 4;

const DAYS_IN_WEEK = 7;
const MAX_DAYS_IN_MONTH = 31;

/* Schedule interval type tokens */
const intervalTokens = {
    [INTERVAL_DAY]: 'SCHEDULE_ITEM_EVERY_DAY',
    [INTERVAL_WEEK]: 'SCHEDULE_ITEM_EVERY_WEEK',
    [INTERVAL_MONTH]: 'SCHEDULE_ITEM_EVERY_MONTH',
    [INTERVAL_YEAR]: 'SCHEDULE_ITEM_EVERY_YEAR',
};
const stepIntervalTokens = {
    [INTERVAL_DAY]: 'SCHEDULE_ITEM_EVERY_N_DAY',
    [INTERVAL_WEEK]: 'SCHEDULE_ITEM_EVERY_N_WEEK',
    [INTERVAL_MONTH]: 'SCHEDULE_ITEM_EVERY_N_MONTH',
    [INTERVAL_YEAR]: 'SCHEDULE_ITEM_EVERY_N_YEAR',
};
/* Schedule interval offset tokens */
const weekOffsetTokens = [
    'SCHEDULE_ITEM_ON_MONDAYS',
    'SCHEDULE_ITEM_ON_TUESDAYS',
    'SCHEDULE_ITEM_ON_WEDNESDAYS',
    'SCHEDULE_ITEM_ON_THURSDAYS',
    'SCHEDULE_ITEM_ON_FRIDAYS',
    'SCHEDULE_ITEM_ON_SATURDAYS',
    'SCHEDULE_ITEM_ON_SUNDAYS',
];

/** Scheduled transaction item */
export class ScheduledTransaction {
    static requiredProps = [
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

    static availProps = [
        'id',
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
        'createdate',
        'updatedate',
    ];

    static debtProps = [
        'id',
        'type',
        'person_id',
        'acc_id',
        'op',
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
        'createdate',
        'updatedate',
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

    static intervalTypes = {
        [INTERVAL_NONE]: 'none',
        [INTERVAL_DAY]: 'day',
        [INTERVAL_WEEK]: 'week',
        [INTERVAL_MONTH]: 'month',
        [INTERVAL_YEAR]: 'year',
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

        if (type === INTERVAL_NONE || type === INTERVAL_DAY) {
            return offset === 0;
        }
        if (type === INTERVAL_WEEK) {
            return offset >= 0 && offset < DAYS_IN_WEEK;
        }
        if (type === INTERVAL_MONTH) {
            return offset >= 0 && offset < MAX_DAYS_IN_MONTH;
        }
        if (type === INTERVAL_YEAR) {
            const monthIndex = Math.floor(offset / 100);
            const dayIndex = (offset % 100);

            return (
                monthIndex >= 0
                && monthIndex < MONTHS_IN_YEAR
                && dayIndex >= 0
                && dayIndex < MAX_DAYS_IN_MONTH
            );
        }

        return false;
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

    constructor(data) {
        assert.isObject(data, 'Invalid props');

        const props = {
            ...ScheduledTransaction.defaultProps,
            ...data,
        };

        Object.keys(props).forEach((key) => {
            this[key] = props[key];
        });
    }

    renderInterval() {
        const renderSteps = (this.interval_step > 1);
        const tokens = (renderSteps) ? stepIntervalTokens : intervalTokens;
        const token = tokens[this.interval_type];
        if (!token) {
            return '';
        }

        return (renderSteps)
            ? __(token, App.view.locale, this.interval_step)
            : __(token, App.view.locale);
    }

    renderWeekOffset(offset) {
        const token = weekOffsetTokens[offset];
        return (token) ? __(token, App.view.locale) : '';
    }

    renderMonthOffset(offset) {
        return __('SCHEDULE_ITEM_MONTH_OFFSET', App.view.locale, (offset + 1));
    }

    renderYearOffset(offset) {
        const date = new Date();
        date.setMonth(Math.floor(offset / 100));
        date.setDate((offset % 100) + 1);

        return App.formatDate(date, {
            locales: App.view.locale,
            options: { month: 'long', day: 'numeric' },
        });
    }

    renderIntervalOffset() {
        if (this.interval_type === INTERVAL_WEEK) {
            return this.renderWeekOffset(this.interval_offset);
        }
        if (this.interval_type === INTERVAL_MONTH) {
            return this.renderMonthOffset(this.interval_offset);
        }
        if (this.interval_type === INTERVAL_YEAR) {
            return this.renderYearOffset(this.interval_offset);
        }

        return '';
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
        while (interval && (limit === 0 || res.length < limit) && interval <= endDate) {
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
