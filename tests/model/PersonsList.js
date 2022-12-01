import { copyObject, hasFlag, assert } from 'jezve-test';
import { List } from './List.js';
import { api } from './api.js';

export const PERSON_HIDDEN = 1;

export class PersonsList extends List {
    async fetch() {
        return api.person.list();
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
        assert(item, 'Invalid person');

        return hasFlag(item.flags, PERSON_HIDDEN);
    }

    getVisible(returnRaw = false) {
        const res = this.filter((item) => !this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return PersonsList.create(res);
    }

    getHidden(returnRaw = false) {
        const res = this.filter((item) => this.isHidden(item));

        if (returnRaw) {
            return copyObject(res);
        }

        return PersonsList.create(res);
    }

    sortByVisibility() {
        this.data.sort((a, b) => a.flags - b.flags);
    }
}
