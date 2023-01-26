import { assert } from 'jezve-test';
import { __ } from './locale.js';
import { Transaction } from './Transaction.js';

/** Category model */
export class Category {
    static getTypeString(type) {
        return (type !== 0)
            ? Transaction.typeToString(type).toLowerCase()
            : 'any';
    }

    /** Return title string for specified transaction type */
    static typeToString(value, locale = 'en') {
        return (value !== 0) ? Transaction.typeToString(value, locale) : __('TR_ANY', locale);
    }

    constructor(data) {
        assert(data, 'Invalid data');

        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.parent_id = data.parent_id;
        this.pos = data.pos;
        this.createdate = data.createdate;
        this.updatedate = data.updatedate;
    }
}
