import { Color } from './Color.js';
import { ListModel } from './ListModel.js';
import { api } from './api.js';

/**
 * Colors list model class
 */
export class ColorListModel extends ListModel {
    static async create() {
        const data = await api.color.list();
        return super.create(data);
    }

    async fetch() {
        return api.color.list();
    }

    createItem(obj) {
        return new Color(obj);
    }
}
