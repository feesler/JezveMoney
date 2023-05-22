import { __ } from '../utils/utils.js';
import { ListItem } from './ListItem.js';

const availFields = [
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

/** Schedule interval types */
export const INTERVAL_NONE = 0;
export const INTERVAL_DAY = 1;
export const INTERVAL_WEEK = 2;
export const INTERVAL_MONTH = 3;
export const INTERVAL_YEAR = 4;

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

/**
 * @constructor ScheduledTransaction class
 * @param {*} props
 */
export class ScheduledTransaction extends ListItem {
    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        return typeof field === 'string' && availFields.includes(field);
    }

    renderInterval() {
        const renderSteps = (this.interval_step > 1);
        const tokens = (renderSteps) ? stepIntervalTokens : intervalTokens;
        const token = tokens[this.interval_type];
        if (!token) {
            return '';
        }

        return (renderSteps) ? __(token, this.interval_step) : __(token);
    }

    renderWeekOffset(offset) {
        const token = weekOffsetTokens[offset];
        return (token) ? __(token) : '';
    }

    renderMonthOffset(offset) {
        return __('SCHEDULE_ITEM_MONTH_OFFSET', (offset + 1));
    }

    renderYearOffset(offset) {
        const date = new Date();
        date.setMonth(Math.floor(offset / 100));
        date.setDate((offset % 100) + 1);

        return window.app.formatDate(date, {
            locales: window.app.locale,
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
}
