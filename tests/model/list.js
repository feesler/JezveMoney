import { copyObject } from '../common.js';

export class List {
    constructor(data = []) {
        if (!Array.isArray(data)) {
            throw new Error('Invalid data specified');
        }

        this.setData(data);
    }

    get length() {
        return this.data.length;
    }

    setData(data) {
        this.data = copyObject(data);
    }

    reset() {
        this.data = [];
    }

    async fetch() {
        throw new Error('Fetch not implemented');
    }

    async refresh() {
        const newData = await this.fetch();
        this.setData(newData);
    }

    getItem(id) {
        const itemId = parseInt(id, 10);
        if (!itemId) {
            return null;
        }
        const res = this.data.find((item) => item.id === itemId);
        return copyObject(res);
    }

    getItems(ids) {
        const itemIds = (Array.isArray(ids) ? ids : [ids])
            .map((id) => parseInt(id, 10));
        const res = this.data.filter((item) => itemIds.includes(item.id));
        return copyObject(res);
    }

    getItemByIndex(ind) {
        const pos = parseInt(ind, 10);
        if (Number.isNaN(pos) || pos < 0 || pos >= this.length) {
            return null;
        }

        return copyObject(this.data[pos]);
    }

    // Return index of item with specified id
    getIndexOf(id) {
        const itemId = parseInt(id, 10);
        if (!itemId) {
            return null;
        }

        return this.data.findIndex((item) => item.id === itemId);
    }

    getLatestId() {
        let res = 0;
        for (const item of this.data) {
            res = Math.max(item.id, res);
        }

        return res;
    }

    /** Return id of item with specified index(absolute position) in list */
    indexToId(pos) {
        const ind = parseInt(pos, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.length) {
            throw new Error(`Invalid position ${pos} specified`);
        }

        const item = this.data[pos];
        return item.id;
    }

    indexesToIds(positions) {
        const posList = Array.isArray(positions) ? positions : [positions];

        return posList.map((pos) => this.indexToId(pos));
    }

    // Return expected value of next id
    getNextId() {
        if (this.autoincrement) {
            return this.autoincrement;
        }

        const latest = this.getLatestId();
        if (latest > 0) {
            return latest + 1;
        }

        return 0;
    }

    /**
     * Push item to the end of list, automatically generate id
     * Return index of new item in the list
     * @param {Object} item - item data
     */
    create(item) {
        if (!item) {
            throw new Error('Invalid item');
        }

        const itemObj = copyObject(item);

        const nextId = this.getNextId();
        if (nextId) {
            itemObj.id = nextId;
            this.autoincrement = nextId + 1;
        }

        const res = this.length;
        this.data.push(itemObj);

        return res;
    }

    /**
     * Rewrite existing item in the list with specified data
     * item object must contain valid 'id' field
     * @param {Object} item - item data
     */
    update(item) {
        if (!item || !item.id) {
            throw new Error('Invalid item');
        }

        const ind = this.getIndexOf(item.id);
        if (ind === -1) {
            return false;
        }

        const itemObj = copyObject(item);
        this.data.splice(ind, 1, itemObj);

        return true;
    }

    deleteItems(ids) {
        const res = List.deleteByIds(this.data, ids);
        this.data = res;

        return true;
    }

    static deleteByIds(list, ids) {
        if (!Array.isArray(list) || !ids) {
            throw new Error('Unexpected input');
        }

        const itemIds = Array.isArray(ids) ? ids : [ids];
        const res = copyObject(list);
        for (const id of itemIds) {
            const itemId = parseInt(id, 10);
            if (!itemId) {
                continue;
            }

            const ind = res.findIndex((item) => item.id === itemId);
            if (ind !== -1) {
                res.splice(ind, 1);
            }
        }

        return res;
    }
}
