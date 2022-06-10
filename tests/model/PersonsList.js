import { copyObject, hasFlag } from 'jezve-test';
import { List } from './List.js';
import { api } from './api.js';

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
            res = this.find((item) => item.name === name);
        } else {
            const lookupName = name.toLowerCase();
            res = this.find((item) => item.name.toLowerCase() === lookupName);
        }

        return copyObject(res);
    }

    isHidden(item) {
        if (!item) {
            throw new Error('Invalid person');
        }

        return hasFlag(item.flags, PERSON_HIDDEN);
    }

    getVisible(returnRaw = false) {
        const res = this.filter((item) => !this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return new PersonsList(res);
    }

    getHidden(returnRaw = false) {
        const res = this.filter((item) => this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return new PersonsList(res);
    }
}
