import { App } from '../Application/App.js';
import { ListItem } from './ListItem.js';

const availFields = [
    'id',
    'schedule_id',
    'state',
    'date',
    'transaction_id',
    'createdate',
    'updatedate',
    'selected',
];

const commonTransactionFields = [
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

/* Reminder state */
export const REMINDER_UPCOMING = 0;
export const REMINDER_SCHEDULED = 1;
export const REMINDER_CONFIRMED = 2;
export const REMINDER_CANCELLED = 3;

/**
 * Scheduled transaction reminder class
 */
export class Reminder extends ListItem {
    static stateNames = {
        [REMINDER_UPCOMING]: 'upcoming',
        [REMINDER_SCHEDULED]: 'scheduled',
        [REMINDER_CONFIRMED]: 'confirmed',
        [REMINDER_CANCELLED]: 'cancelled',
    };

    static getStateName(stateType) {
        const type = parseInt(stateType, 10);
        return this.stateNames[type] ?? null;
    }

    /**
     * Creates new extended reminder
     *
     * @param {Object} props reminder props object
     */
    static createExtended(props) {
        const reminder = this.create(props);

        const scheduleItem = App.model.schedule.getItem(props.schedule_id);
        if (!scheduleItem) {
            throw new Error('Scheduled transaction not found');
        }

        commonTransactionFields.forEach((field) => {
            reminder[field] = scheduleItem[field];
        });

        return reminder;
    }

    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        return typeof field === 'string' && availFields.includes(field);
    }
}
