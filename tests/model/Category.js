import { assert } from '@jezvejs/assert';
import { __ } from './locale.js';
import { Transaction } from './Transaction.js';
import { App } from '../Application.js';

/** Category model */
export class Category {
    static availProps = [
        'name',
        'color',
        'parent_id',
        'type',
    ];

    static availTypes = [...Transaction.availTypes, 0];

    static getTypeString(type) {
        return (type !== 0)
            ? Transaction.getTypeName(type)
            : 'any';
    }

    /** Return title string for specified transaction type */
    static typeToString(value, locale = App.view.locale) {
        return (value !== 0)
            ? Transaction.typeToString(value, locale)
            : __('transactions.types.any', locale);
    }

    constructor(data) {
        assert(data, 'Invalid data');

        this.id = data.id;
        this.name = data.name;
        this.color = data.color;
        this.type = data.type;
        this.parent_id = data.parent_id;
        this.pos = data.pos;
        this.createdate = data.createdate;
        this.updatedate = data.updatedate;
    }
}
