import {
    createElement,
    getClassName,
    removeChilds,
} from '@jezvejs/dom';

import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
import { INTERVAL_NONE, ScheduledTransaction } from '../../../../Models/ScheduledTransaction.js';

import { Field } from '../../../../Components/Common/Field/Field.js';
import { TransactionListItemBase } from '../../../../Components/Transaction/TransactionListItemBase/TransactionListItemBase.js';
import { ListItem } from '../../../../Components/List/ListItem/ListItem.js';

import './ScheduleListItem.scss';

/** CSS classes */
const ITEM_CLASS = 'schedule-item';
const SCHEDULE_GROUP_CLASS = 'schedule-item__schedule';
const DATE_RANGE_CLASS = 'schedule-item__date-range';
const START_DATE_CLASS = 'schedule-item__start-date';
const END_DATE_CLASS = 'schedule-item__end-date';
const INTERVAL_CLASS = 'schedule-item__interval';
const OFFSET_CLASS = 'schedule-item__offset';
/* Details mode */
const DETAILS_CLASS = 'schedule-item_details';
const COLUMN_CLASS = 'schedule-item__column';
/* Fields */
const START_DATE_FIELD_CLASS = 'schedule-item__start-date-field';
const END_DATE_FIELD_CLASS = 'schedule-item__end-date-field';
const INTERVAL_FIELD_CLASS = 'schedule-item__interval-field';
const OFFSET_FIELD_CLASS = 'schedule-item__offset-field';

const defaultProps = {
};

/**
 * Scheduled transaction list item component
 */
export class ScheduleListItem extends ListItem {
    static get selector() {
        return `.${ITEM_CLASS}`;
    }

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(ITEM_CLASS, props.className),
            item: ScheduledTransaction.create(props.item),
        });
    }

    init() {
        super.init();

        this.scheduleGroup = createElement('div', { props: { className: SCHEDULE_GROUP_CLASS } });
        this.contentElem.append(this.scheduleGroup);
    }

    initClassic() {
        this.dateRangeElem = createElement('div', { props: { className: DATE_RANGE_CLASS } });
        this.intervalElem = createElement('div', { props: { className: INTERVAL_CLASS } });
        this.offsetElem = createElement('div', { props: { className: OFFSET_CLASS } });

        this.scheduleGroup.append(
            this.dateRangeElem,
            this.intervalElem,
            this.offsetElem,
        );
    }

    initDetails() {
        // Start date
        this.startDateElem = createElement('div', { props: { className: START_DATE_CLASS } });
        this.startDateField = Field.create({
            title: __('schedule.startDate'),
            content: this.startDateElem,
            className: START_DATE_FIELD_CLASS,
        });
        // End date
        this.endDateElem = createElement('div', { props: { className: END_DATE_CLASS } });
        this.endDateField = Field.create({
            title: __('schedule.endDate'),
            content: this.endDateElem,
            className: END_DATE_FIELD_CLASS,
        });
        const dateRangeGroup = createElement('div', {
            props: { className: COLUMN_CLASS },
            children: [this.startDateField.elem, this.endDateField.elem],
        });

        // Interval
        this.intervalElem = createElement('div', { props: { className: INTERVAL_CLASS } });
        this.intervalField = Field.create({
            title: __('schedule.repeat'),
            content: this.intervalElem,
            className: INTERVAL_FIELD_CLASS,
        });
        // Interval offset
        this.offsetElem = createElement('div', { props: { className: OFFSET_CLASS } });
        this.offsetField = Field.create({
            title: __('schedule.intervalOffset'),
            content: this.offsetElem,
            className: OFFSET_FIELD_CLASS,
        });
        const intervalGroup = createElement('div', {
            props: { className: COLUMN_CLASS },
            children: [this.intervalField.elem, this.offsetField.elem],
        });

        this.scheduleGroup.append(
            dateRangeGroup,
            intervalGroup,
        );
    }

    resetContent() {
        removeChilds(this.scheduleGroup);

        // Details mode elements
        this.startDateField = null;
        this.endDateField = null;
        this.intervalField = null;
        this.offsetField = null;
        // Common
        this.startDateElem = null;
        this.endDateElem = null;
        this.dateRangeElem = null;
        this.intervalElem = null;
        this.offsetElem = null;
    }

    renderDateRange(item) {
        const start = __('schedule.item.start', App.formatDate(item.start_date));
        if (!item.end_date) {
            return start;
        }

        const end = __('schedule.item.end', App.formatDate(item.end_date));
        return `${start} ${end}`;
    }

    renderClassic(state) {
        const { item } = state;

        this.dateRangeElem.textContent = this.renderDateRange(item);
        this.intervalElem.textContent = item.renderInterval();
        this.offsetElem.textContent = item.renderIntervalOffset();
    }

    renderStartDateField(state) {
        const { item } = state;
        const startDateToken = (item.interval_type === INTERVAL_NONE)
            ? 'schedule.date'
            : 'schedule.startDate';
        this.startDateField.setTitle(__(startDateToken));
        this.startDateField.setContent(App.formatDate(item.start_date));
    }

    renderEndDate(item) {
        return (item.end_date)
            ? __('schedule.item.end', App.formatDate(item.end_date))
            : __('schedule.noEndDate');
    }

    renderEndDateField(state) {
        const { item } = state;
        this.endDateField.show(item.interval_type !== INTERVAL_NONE);
        this.endDateField.setContent(this.renderEndDate(item));
    }

    renderIntervalField(state) {
        const { item } = state;
        this.intervalField.setContent(item.renderInterval());
    }

    renderIntervalOffsetField(state) {
        const { item } = state;
        this.offsetField.show(item.interval_type !== INTERVAL_NONE);
        this.offsetField.setContent(item.renderIntervalOffset());
    }

    renderDetails(state) {
        this.renderStartDateField(state);
        this.renderEndDateField(state);
        this.renderIntervalField(state);
        this.renderIntervalOffsetField(state);
    }

    renderScheduleContent(state, prevState) {
        if (state.mode !== prevState.mode) {
            this.resetContent();
            if (state.mode === 'details') {
                this.initDetails();
            } else {
                this.initClassic();
            }
        }

        if (state.mode === 'details') {
            this.renderDetails(state);
        } else {
            this.renderClassic(state);
        }
    }

    renderTransactionContent(state, prevState) {
        if (
            state.item === prevState?.item
            && state.mode === prevState?.mode
        ) {
            return;
        }

        const transactionState = {
            item: state.item,
            mode: state.mode,
            showDate: false,
            showResults: false,
        };

        if (this.transactionBase) {
            this.transactionBase.setState(transactionState);
        } else {
            this.transactionBase = TransactionListItemBase.create(transactionState);
            this.contentElem.append(this.transactionBase.elem);
        }
    }

    renderContent(state, prevState) {
        this.renderScheduleContent(state, prevState);
        this.renderTransactionContent(state, prevState);
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        const { item } = state;
        if (!item) {
            throw new Error('Invalid transaction object');
        }

        this.elem.setAttribute('data-type', item.type);
        this.elem.classList.toggle(DETAILS_CLASS, state.mode === 'details');
    }
}
