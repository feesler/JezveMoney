import { asArray, assert } from 'jezve-test';
import { Currency } from './Currency.js';
import { List } from './List.js';
import { api } from './api.js';

export class CurrencyList extends List {
    static async create() {
        const data = await api.currency.list();
        return super.create(data);
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

    findByCode(code) {
        const uCode = code?.toUpperCase() ?? null;
        if (uCode === null) {
            return null;
        }

        const currObj = this.find((item) => item.code.toUpperCase() === uCode);
        return currObj ?? null;
    }

    getItemsByCodes(codes) {
        return asArray(codes).map((name) => {
            const item = this.findByCode(name);
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
