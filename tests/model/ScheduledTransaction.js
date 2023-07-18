import { asArray, assert, isDate } from 'jezve-test';
import {
    DEBT,
    EXPENSE,
    INCOME,
    LIMIT_CHANGE,
    TRANSFER,
    Transaction,
} from './Transaction.js';
import {
    DAYS_IN_WEEK,
    INTERVAL_DAY,
    INTERVAL_MONTH,
    INTERVAL_NONE,
    INTERVAL_WEEK,
    INTERVAL_YEAR,
    MONTHS_IN_YEAR,
    cutDate,
    getWeekdayShort,
    secondsToTime,
    shiftDate,
    stepInterval,
} from '../common.js';
import { __ } from './locale.js';
import { App } from '../Application.js';

const MAX_DAYS_IN_MONTH = 31;

/* Schedule interval type tokens */
const intervalTokens = {
    [INTERVAL_DAY]: 'schedule.item.everyDay',
    [INTERVAL_WEEK]: 'schedule.item.everyWeek',
    [INTERVAL_MONTH]: 'schedule.item.everyMonth',
    [INTERVAL_YEAR]: 'schedule.item.everyYear',
};
const stepIntervalTokens = {
    [INTERVAL_DAY]: 'schedule.item.everyNDay',
    [INTERVAL_WEEK]: 'schedule.item.everyNWeek',
    [INTERVAL_MONTH]: 'schedule.item.everyNMonth',
    [INTERVAL_YEAR]: 'schedule.item.everyNYear',
};
/* Schedule interval offset tokens */
const weekOffsetTokens = [
    'schedule.item.onSundays',
    'schedule.item.onMondays',
    'schedule.item.onTuesdays',
    'schedule.item.onWednesdays',
    'schedule.item.onThursdays',
    'schedule.item.onFridays',
    'schedule.item.onSaturdays',
];

/** Returns interval offset for specified date */
export const getIntervalOffset = (date, type) => {
    const utcDate = shiftDate(date, 0);

    if (type === INTERVAL_WEEK) {
        return utcDate.getDay();
    }
    if (type === INTERVAL_MONTH) {
        return utcDate.getDate() - 1;
    }
    if (type === INTERVAL_YEAR) {
        return (utcDate.getMonth() * 100) + utcDate.getDate() - 1;
    }

    return 0;
};

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

    static isValidIntervalStep(value, intervalType) {
        const steps = parseInt(value, 10);
        const type = parseInt(intervalType, 10);
        return (
            (type === INTERVAL_NONE && steps === 0)
            || (type !== INTERVAL_NONE && steps > 0)
        );
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
        if (this.interval_type === INTERVAL_NONE) {
            return __('schedule.item.noRepeat', App.view.locale);
        }

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
        const intervalOffsets = asArray(offset).sort((a, b) => a - b);
        if (intervalOffsets.length === 1) {
            const token = weekOffsetTokens[offset];
            return (token) ? __(token, App.view.locale) : '';
        }

        const date = new Date();
        const firstDay = shiftDate(date, -date.getDay());

        const weekdaysFmt = intervalOffsets.map((item) => (
            getWeekdayShort(
                shiftDate(firstDay, item),
                App.view.locale,
            )
        ));

        return weekdaysFmt.join(' ');
    }

    renderMonthOffset(offset) {
        const monthDay = parseInt(offset, 10);
        return __('schedule.item.monthOffset', App.view.locale, (monthDay + 1));
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

    getIntervalStart(timestamp, intervalType) {
        assert(ScheduledTransaction.isValidIntervalType(intervalType), 'Invalid group type');

        const date = isDate(timestamp) ? timestamp : new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthDay = date.getDate();
        let res = 0;

        if (intervalType === INTERVAL_NONE || intervalType === INTERVAL_DAY) {
            res = Date.UTC(year, month, monthDay);
        }
        if (intervalType === INTERVAL_WEEK) {
            let weekday = date.getDay();
            weekday = (weekday === 0) ? 6 : (weekday - 1);
            res = Date.UTC(year, month, monthDay - weekday);
        }
        if (intervalType === INTERVAL_MONTH) {
            res = Date.UTC(year, month, 1);
        }
        if (intervalType === INTERVAL_YEAR) {
            res = Date.UTC(year, 0, 1);
        }

        return new Date(res);
    }

    getDateIntervalOffset(timestamp, intervalType) {
        assert(ScheduledTransaction.isValidIntervalType(intervalType), 'Invalid group type');

        const date = isDate(timestamp) ? timestamp : new Date(timestamp);

        if (intervalType === INTERVAL_WEEK) {
            const weekday = date.getDay();
            return (weekday === 0) ? 6 : (weekday - 1);
        }
        if (intervalType === INTERVAL_MONTH) {
            return date.getDate();
        }
        if (intervalType === INTERVAL_YEAR) {
            return (date.getMonth() * 100) + date.getDate();
        }

        return 0;
    }

    getFirstInterval() {
        const time = secondsToTime(this.start_date);
        return this.getIntervalStart(time, this.interval_type);
    }

    getDefaultIntervalOffset() {
        const time = secondsToTime(this.start_date);
        return this.getDateIntervalOffset(time, this.interval_type);
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

        const res = stepInterval(timestamp, this.interval_type, this.interval_step);
        if (endDate && endDate < res) {
            return null;
        }

        return this.getIntervalStart(res, this.interval_type);
    }

    getReminderDates(timestamp) {
        const dayStart = cutDate(new Date(timestamp));

        const offsets = [...asArray(this.interval_offset)];
        if (offsets.length === 0) {
            offsets.push(this.getDefaultIntervalOffset());
        }

        return offsets.map((value) => {
            let res = new Date(dayStart);
            let offset = value;

            if (
                this.interval_type !== INTERVAL_NONE
                && offset > 0
            ) {
                if (this.interval_type === INTERVAL_WEEK) {
                    offset = (offset === 0) ? 6 : (offset - 1);
                }

                res = shiftDate(res, offset);
            }

            return res.getTime();
        });
    }

    getReminders(options = {}) {
        const start = secondsToTime(this.start_date);

        const { limit = 100 } = options;
        let {
            startDate = start,
            endDate = Date.now(),
        } = options;

        startDate = Math.max(start, startDate);

        if (this.interval_type === INTERVAL_NONE) {
            endDate = startDate;
        } else if (this.end_date) {
            const endTime = secondsToTime(this.end_date);
            endDate = Math.min(endTime, endDate);
        }

        const res = [];
        let interval = this.getIntervalStart(startDate, this.interval_type);

        while (
            interval
            && (limit === 0 || res.length < limit)
            && interval <= endDate
        ) {
            if (interval >= startDate) {
                const dates = this.getReminderDates(interval);
                dates.forEach((date) => {
                    if (date <= endDate) {
                        res.push(date);
                    }
                });
            }

            interval = this.getNextInterval(interval);
        }

        return res;
    }

    getIntervalDays() {
        const type = this.interval_type;
        if (type === INTERVAL_DAY) {
            return 1;
        }
        if (type === INTERVAL_WEEK) {
            return 7;
        }
        if (type === INTERVAL_MONTH) {
            return 30;
        }
        if (type === INTERVAL_YEAR) {
            return 365;
        }

        return 0;
    }

    getIntervalLength() {
        const offsets = asArray(this.interval_offset);
        const maxOffset = offsets.reduce((prev, offset) => Math.max(prev, offset), 0);
        return this.getIntervalDays() * this.interval_step + maxOffset;
    }
}
