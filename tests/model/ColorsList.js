import { Color } from './Color.js';
import { List } from './List.js';
import { api } from './api.js';

export class ColorsList extends List {
    static async create() {
        const data = await api.color.list();
        return new ColorsList(data);
    }

    async fetch() {
        return api.color.list();
    }

    createItem(obj) {
        return new Color(obj);
    }
}
