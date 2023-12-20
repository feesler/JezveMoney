import { createElement, enable, getClassName } from '@jezvejs/dom';

import { App } from '../../../Application/App.js';

import { Reminder } from '../../../Models/Reminder.js';

import { ListItem } from '../../List/ListItem/ListItem.js';
import { TransactionListItemBase } from '../../Transaction/TransactionListItemBase/TransactionListItemBase.js';

import './ReminderListItem.scss';

/** CSS classes */
const ITEM_CLASS = 'reminder-item';
const SCHEDULE_CLASS = 'reminder-item__schedule';
const SCHEDULE_NAME_CLASS = 'reminder-item__schedule-name';
const SCHEDULE_INTERVAL_CLASS = 'reminder-item__schedule-interval';

const defaultProps = {
    mode: 'classic', // 'classic' or 'details'
    disabled: false,
};

/**
 * Scheduled transaction reminder list item component
 */
export class ReminderListItem extends ListItem {
    static get selector() {
        return `.${ITEM_CLASS}`;
    }

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(ITEM_CLASS, props.className),
            item: Reminder.createExtended(props.item),
        });
    }

    getScheduleName(state) {
        const { item } = state;
        const { schedule } = App.model;
        const scheduleItem = schedule.getItem(item.schedule_id);
        if (!scheduleItem) {
            throw new Error('Scheduled transaction not found');
        }

        return scheduleItem.name;
    }

    renderScheduleContent(state, prevState) {
        if (state.item === prevState?.item) {
            return;
        }

        if (!this.scheduleInfo) {
            this.scheduleNameElem = createElement('div', {
                props: { className: SCHEDULE_NAME_CLASS },
            });
            this.scheduleIntervalElem = createElement('div', {
                props: { className: SCHEDULE_INTERVAL_CLASS },
            });

            this.scheduleInfo = createElement('div', {
                props: { className: SCHEDULE_CLASS },
                children: [
                    this.scheduleNameElem,
                ],
            });

            this.contentElem.prepend(this.scheduleInfo);
        }

        const scheduleName = this.getScheduleName(state);
        this.scheduleNameElem.textContent = scheduleName;
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
            showDate: true,
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

        this.elem.setAttribute('data-id', item.id ?? 0);
        this.elem.setAttribute('data-schedule-id', item.schedule_id);
        this.elem.setAttribute('data-date', item.date);
        this.elem.setAttribute('data-type', item.type);

        enable(this.elem, !state.disabled);
    }
}
