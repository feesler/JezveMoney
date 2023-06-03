import { isObject } from 'jezvejs';

/**
 * @constructor ListItem
 * @param {object} props - properties of list item object
 */
export class ListItem {
    constructor(props) {
        if (!isObject(props)) {
            throw new Error('Invalid list item props');
        }

        Object.keys(props).forEach((prop) => {
            if (this.isAvailField(prop)) {
                this[prop] = props[prop];
            }
        });
    }

    /** Static alias for ListItem constructor */
    static create(props) {
        return new this(props);
    }

    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        return (typeof field === 'string');
    }
}
