import { hasFlag, assert } from 'jezve-test';
import { SortableList } from './SortableList.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
} from '../common.js';
import { api } from './api.js';

export const PERSON_HIDDEN = 1;

export class PersonsList extends SortableList {
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

        return structuredClone(res);
    }

    isHidden(item) {
        assert(item, 'Invalid person');

        return hasFlag(item.flags, PERSON_HIDDEN);
    }

    getVisible(returnRaw = false) {
        const res = this.filter((item) => !this.isHidden(item));

        if (returnRaw) {
            return structuredClone(res);
        }

        return PersonsList.create(res);
    }

    getHidden(returnRaw = false) {
        const res = this.filter((item) => this.isHidden(item));

        if (returnRaw) {
            return structuredClone(res);
        }

        return PersonsList.create(res);
    }

    sortByVisibility() {
        this.data.sort((a, b) => a.flags - b.flags);
    }

    sortBy(sortMode) {
        if (sortMode === SORT_BY_CREATEDATE_ASC) {
            this.sortByCreateDateAsc();
        } else if (sortMode === SORT_BY_CREATEDATE_DESC) {
            this.sortByCreateDateDesc();
        } else if (sortMode === SORT_BY_NAME_ASC) {
            this.sortByNameAsc();
        } else if (sortMode === SORT_BY_NAME_DESC) {
            this.sortByNameDesc();
        } else if (sortMode === SORT_MANUALLY) {
            this.sortByPos();
        }
    }

    sortByPos() {
        this.data.sort((a, b) => a.pos - b.pos);
    }

    sortByNameAsc() {
        this.data.sort((a, b) => ((a.name > b.name) ? 1 : -1));
    }

    sortByNameDesc() {
        this.data.sort((a, b) => ((a.name < b.name) ? 1 : -1));
    }

    sortByCreateDateAsc() {
        this.data.sort((a, b) => a.id - b.id);
    }

    sortByCreateDateDesc() {
        this.data.sort((a, b) => b.id - a.id);
    }
}
