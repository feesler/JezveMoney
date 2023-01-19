import { copyObject, assert, asArray } from 'jezve-test';

export class List {
    static create(props) {
        return new this(props);
    }

    static deleteByIds(list, ids) {
        assert.isArray(list, 'Invalid parameters');
        assert(ids, 'Invalid parameters');

        const itemIds = asArray(ids)
            .map((id) => parseInt(id, 10))
            .filter((id) => !!id);

        const res = copyObject(list)
            .filter((item) => !itemIds.includes(item.id));

        return res;
    }

    constructor(data = []) {
        if (data instanceof List) {
            this.setData(data.data);
        } else if (Array.isArray(data)) {
            this.setData(data);
        } else {
            throw new Error('Invalid data specified');
        }
    }

    get length() {
        return this.data.length;
    }

    clone() {
        const res = new this.constructor(this.data);
        res.autoincrement = this.autoincrement;

        return res;
    }

    setData(data) {
        this.data = data.map((item) => this.createItem(item));
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

    getIds() {
        return this.data.map((item) => item.id);
    }

    getItem(id) {
        const itemId = parseInt(id, 10);
        if (!itemId) {
            return null;
        }
        const res = this.data.find((item) => item.id === itemId);
        return (res) ? this.createItem(res) : null;
    }

    getItems(ids) {
        const itemIds = asArray(ids).map((id) => parseInt(id, 10));
        const res = this.filter((item) => itemIds.includes(item.id));
        return res.map((item) => this.createItem(item));
    }

    getItemByIndex(ind) {
        const pos = parseInt(ind, 10);
        if (Number.isNaN(pos) || pos < 0 || pos >= this.length) {
            return null;
        }

        return this.createItem(this.data[pos]);
    }

    // Return index of item with specified id
    getIndexById(id) {
        const itemId = parseInt(id, 10);
        if (!itemId) {
            return null;
        }

        return this.data.findIndex((item) => item.id === itemId);
    }

    getLatestId() {
        return this.data.reduce((res, item) => Math.max(item.id, res), 0);
    }

    /** Return id of item with specified index(absolute position) in list */
    indexToId(pos) {
        const ind = parseInt(pos, 10);
        assert(
            !Number.isNaN(ind) && ind >= 0 && ind < this.length,
            `Invalid position ${pos} specified`,
        );

        const item = this.data[ind];
        return item.id;
    }

    indexesToIds(positions) {
        return asArray(positions).map((pos) => this.indexToId(pos));
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

    /** Convert object to list item */
    createItem(obj) {
        return copyObject(obj);
    }

    /**
     * Push item to the end of list
     * Return index of new item in the list
     * @param {Object} item - item data
     */
    addItem(item) {
        assert(item, 'Invalid item');

        const res = this.length;
        this.data.push(item);

        return res;
    }

    /**
     * Push item to the end of list, automatically generate id
     * Return index of new item in the list
     * @param {Object} item - item data
     */
    create(item) {
        assert(item, 'Invalid item');

        const itemObj = this.createItem(item);

        const nextId = this.getNextId();
        if (nextId) {
            itemObj.id = nextId;
            this.autoincrement = nextId + 1;
        }

        return this.addItem(itemObj);
    }

    /**
     * Rewrite existing item in the list with specified data
     * item object must contain valid 'id' field
     * @param {Object} item - item data
     */
    update(item) {
        assert(item?.id, 'Invalid item');

        const ind = this.getIndexById(item.id);
        if (ind === -1) {
            return false;
        }

        const itemObj = this.createItem(item);
        this.data.splice(ind, 1, itemObj);

        return true;
    }

    deleteItems(ids) {
        const res = List.deleteByIds(this.data, ids);
        this.data = res;

        return true;
    }

    indexOf(...args) {
        return this.data.indexOf(...args);
    }

    forEach(...args) {
        this.data.forEach(...args);
    }

    every(...args) {
        return this.data.every(...args);
    }

    some(...args) {
        return this.data.some(...args);
    }

    find(...args) {
        return this.data.find(...args);
    }

    findIndex(...args) {
        return this.data.findIndex(...args);
    }

    filter(...args) {
        return this.data.filter(...args);
    }

    map(...args) {
        return this.data.map(...args);
    }

    reduce(...args) {
        return this.data.reduce(...args);
    }

    slice(...args) {
        return this.data.slice(...args);
    }
}
