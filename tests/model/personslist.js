import { List } from './list.js';
import { api } from './api.js';
import { copyObject } from '../common.js';

/* eslint-disable no-bitwise */

export const PERSON_HIDDEN = 1;

export class PersonsList extends List {
    async fetch() {
        return api.person.list();
    }

    clone() {
        const res = new PersonsList(this.data);
        res.autoincrement = this.autoincrement;

        return res;
    }

    findByName(name, caseSens = false) {
        let res;

        if (caseSens) {
            res = this.data.find((item) => item.name === name);
        } else {
            const lookupName = name.toLowerCase();
            res = this.data.find((item) => item.name.toLowerCase() === lookupName);
        }

        return copyObject(res);
    }

    isHidden(item) {
        if (!item) {
            throw new Error('Invalid person');
        }

        return (item.flags & PERSON_HIDDEN) === PERSON_HIDDEN;
    }

    getVisible(returnRaw = false) {
        const res = this.data.filter((item) => !this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return new PersonsList(res);
    }

    getHidden(returnRaw = false) {
        const res = this.data.filter((item) => this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return new PersonsList(res);
    }
}
