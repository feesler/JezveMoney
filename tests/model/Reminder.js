import { assert } from 'jezve-test';

export const REMINDER_UPCOMING = 0;
export const REMINDER_SCHEDULED = 1;
export const REMINDER_CONFIRMED = 2;
export const REMINDER_CANCELLED = 3;

/** Scheduled transaction reminder item */
export class Reminder {
    static availProps = [
        'schedule_id',
        'state',
        'date',
        'transaction_id',
    ];

    static commonTransactionProps = [
        'type',
        'src_id',
        'dest_id',
        'src_curr',
        'dest_curr',
        'dest_curr',
        'src_amount',
        'dest_amount',
        'category_id',
        'comment',
    ];

    static defaultProps = {
        transaction_id: 0,
    };

    static availStates = [
        REMINDER_SCHEDULED,
        REMINDER_CONFIRMED,
        REMINDER_CANCELLED,
    ];

    static allStates = [
        REMINDER_UPCOMING,
        REMINDER_SCHEDULED,
        REMINDER_CONFIRMED,
        REMINDER_CANCELLED,
    ];

    static stateNames = {
        [REMINDER_UPCOMING]: 'upcoming',
        [REMINDER_SCHEDULED]: 'scheduled',
        [REMINDER_CONFIRMED]: 'confirmed',
        [REMINDER_CANCELLED]: 'cancelled',
    };

    static isValidState(value) {
        const state = parseInt(value, 10);
        return this.availStates.includes(state);
    }

    constructor(data) {
        assert.isObject(data, 'Invalid props');

        const props = {
            ...Reminder.defaultProps,
            ...data,
        };

        Object.keys(props).forEach((key) => {
            this[key] = props[key];
        });
    }

    extend(state) {
        const scheduleItem = state.schedule.getItem(this.schedule_id);
        assert(scheduleItem, 'Scheduled transaction not found');

        Reminder.commonTransactionProps.forEach((field) => {
            this[field] = scheduleItem[field];
        });
    }

    confirm(transactionId) {
        assert(transactionId, 'Invalid transaction_id');

        this.state = REMINDER_CONFIRMED;
        this.transaction_id = transactionId;
    }

    cancel() {
        this.state = REMINDER_CANCELLED;
        this.transaction_id = 0;
    }
}
