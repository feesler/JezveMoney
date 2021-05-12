import { ListItem } from './ListItem.js';

/* eslint no-bitwise: "off" */

/** Person flags */
export const PERSON_HIDDEN = 1;

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
        const availFields = ['id', 'name', 'flags', 'accounts'];

        return typeof field === 'string' && availFields.includes(field);
    }

    /**
     * Check person is not hidden
     */
    isVisible() {
        if (!('flags' in this)) {
            throw new Error('Invalid person');
        }

        return (this.flags & PERSON_HIDDEN) === 0;
    }
}
