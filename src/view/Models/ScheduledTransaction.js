import {
    DEFAULT_FIRST_DAY_OF_WEEK,
    getFirstDayOfWeek,
    getWeekdayShort,
    shiftDate,
} from '@jezvejs/datetime';
import { asArray } from '@jezvejs/types';
import { firstUpperCase } from 'jezvejs';
import { __ } from '../utils/utils.js';
import { App } from '../Application/App.js';
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
        if (this.interval_type === INTERVAL_NONE) {
            return __('schedule.item.noRepeat');
        }

        const renderSteps = (this.interval_step > 1);
        const tokens = (renderSteps) ? stepIntervalTokens : intervalTokens;
        const token = tokens[this.interval_type];
        if (!token) {
            return '';
        }

        return (renderSteps) ? __(token, this.interval_step) : __(token);
    }

    renderWeekOffset(offset) {
        const intervalOffsets = asArray(offset).sort((a, b) => a - b);
        if (intervalOffsets.length === 1) {
            const token = weekOffsetTokens[offset];
            return (token) ? __(token) : '';
        }

        const firstDay = getFirstDayOfWeek(new Date(), {
            locales: App.locale,
            options: { firstDay: DEFAULT_FIRST_DAY_OF_WEEK },
        });
        const weekdaysFmt = intervalOffsets.map((item) => (
            firstUpperCase(
                getWeekdayShort(shiftDate(firstDay, item), App.locale).substring(0, 3),
                App.locale,
            )
        ));

        return weekdaysFmt.join(' ');
    }

    renderMonthOffset(offset) {
        return __('schedule.item.monthOffset', (parseInt(offset, 10) + 1));
    }

    renderYearOffset(offset) {
        const date = new Date();
        date.setMonth(Math.floor(offset / 100));
        date.setDate((offset % 100) + 1);

        return App.formatDate(date, {
            locales: App.locale,
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
