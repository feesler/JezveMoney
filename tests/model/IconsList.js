import { Icon } from './Icon.js';
import { List } from './List.js';
import { api } from './api.js';

export class IconsList extends List {
    async fetch() {
        return api.icon.list();
    }

    static async create() {
        const data = await api.icon.list();
        return new IconsList(data);
    }

    clone() {
        const res = new IconsList(this.data);
        res.autoincrement = this.autoincrement;

        return res;
    }

    createItem(obj) {
        return new Icon(obj);
    }

    findByName(name) {
        const qName = name.toUpperCase();
        const currObj = this.find((item) => item.name.toUpperCase() === qName);
        if (!currObj) {
            return null;
        }

        return currObj;
    }

    findByFile(val) {
        if (typeof val !== 'string') {
            return null;
        }

        const filename = val.toUpperCase();
        const res = this.find((item) => item.file && item.file.toUpperCase() === filename);
        if (!res) {
            return null;
        }

        return res;
    }
}
