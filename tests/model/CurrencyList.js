import { assert } from 'jezve-test';
import { Currency } from './Currency.js';
import { List } from './List.js';
import { api } from './api.js';

export class CurrencyList extends List {
    static async create() {
        const data = await api.currency.list();
        return new CurrencyList(data);
    }

    async fetch() {
        return api.currency.list();
    }

    createItem(obj) {
        if (!obj) {
            return obj;
        }
        return new Currency(obj);
    }

    findByName(name) {
        const qName = name.toUpperCase();
        const currObj = this.find((item) => item.name.toUpperCase() === qName);
        if (!currObj) {
            return null;
        }

        return currObj;
    }

    getItemsByNames(names) {
        const itemNames = Array.isArray(names) ? names : [names];

        return itemNames.map((name) => {
            const item = this.findByName(name);
            assert(item, `Currency '${name}' not found`);

            return item.id;
        });
    }

    /** Format curency value without access to the instance of class */
    format(currId, val) {
        const item = this.getItem(currId);
        assert(item, `Currency ${currId} not found`);

        return item.format(val);
    }
}
