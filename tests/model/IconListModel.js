import { Icon } from './Icon.js';
import { ListModel } from './ListModel.js';
import { api } from './api.js';

/**
 * Icons list model class
 */
export class IconListModel extends ListModel {
    static async create() {
        const data = await api.icon.list();
        return super.create(data);
    }

    async fetch() {
        return api.icon.list();
    }

    createItem(obj) {
        return new Icon(obj);
    }

    findByName(name) {
        const qName = name.toUpperCase();
        const icon = this.find((item) => item.name.toUpperCase() === qName);
        return icon ?? null;
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
