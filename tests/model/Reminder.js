import { assert } from 'jezve-test';

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

    static defaultProps = {
        transaction_id: 0,
    };

    static availStates = [
        REMINDER_SCHEDULED,
        REMINDER_CONFIRMED,
        REMINDER_CANCELLED,
    ];

    static isValidState(value) {
        const state = parseInt(value, 10);
        return this.availStates.includes(state);
    }

    constructor(props) {
        assert.isObject(props, 'Invalid props');

        if (props.id) {
            this.id = props.id;
        }

        Reminder.availProps.forEach((propName) => {
            assert(propName in props, `Property '${propName}' not found.`);

            this[propName] = props[propName];
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
