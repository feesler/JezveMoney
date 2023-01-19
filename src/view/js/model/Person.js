import { hasFlag } from 'jezvejs';
import { ListItem } from './ListItem.js';

/** Person flags */
export const PERSON_HIDDEN = 1;
/** Available person fields */
const availFields = [
    'id',
    'name',
    'flags',
    'accounts',
    'createdate',
    'updatedate',
];

/**
 * @constructor Person class
 * @param {*} props
 */
export class Person extends ListItem {
    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        return typeof field === 'string' && availFields.includes(field);
    }

    /**
     * Check person is not hidden
     */
    isVisible() {
        if (!('flags' in this)) {
            throw new Error('Invalid person');
        }

        return !hasFlag(this.flags, PERSON_HIDDEN);
    }
}
