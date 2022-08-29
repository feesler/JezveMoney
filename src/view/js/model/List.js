import { copyObject } from 'jezvejs';

/**
 * Base List class
 * @param {object[]} props - array of list items
 */
export class List {
    constructor(props) {
        let data;
        if (props instanceof List) {
            data = props.data;
        } else {
            data = Array.isArray(props) ? props : [];
        }

        this.setData(data);
    }

    /** Static alias for List constructor */
    static create(props) {
        return new List(props);
    }

    get length() {
        return this.data.length;
    }

    /** Wrap method for array forEach method */
    forEach(...args) {
        this.data.forEach(...args);
    }

    /** Wrap method for array map() method */
    map(...args) {
        return this.data.map(...args);
    }

    /** Wrap method for array find() method */
    find(...args) {
        return this.data.find(...args);
    }

    /** Wrap method for array filter() method */
    filter(...args) {
        return this.data.filter(...args);
    }

    /** Wrap method for array every() method */
    every(...args) {
        return this.data.every(...args);
    }

    /** Wrap method for array some() method */
    some(...args) {
        return this.data.some(...args);
    }

    /** Wrap method for array sort() method */
    sort(...args) {
        return this.data.sort(...args);
    }

    /**
     * Assign new data to the list
     * @param {Array} data - array of list items
     */
    setData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Invalid list props');
        }

        const newData = copyObject(data);
        this.data = newData.map(this.createItem.bind(this));
    }

    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return obj;
    }

    /**
     * Add new item to the list
     * @param {Object} obj - object to create new item from
     */
    addItem(obj) {
        this.data.push(this.createItem(obj));
    }

    /**
     * Return item with specified id
     * @param {Number} itemId - identifier of item to find
     */
    getItem(itemId) {
        const id = parseInt(itemId, 10);
        if (!id) {
            return null;
        }

        return this.data.find((item) => item && item.id === id);
    }

    /**
     * Return index of item with specified id
     * Return -1 in case item can't be found
     * @param {Number} itemId - identifier of item to find
     */
    getItemIndex(itemId) {
        const id = parseInt(itemId, 10);
        if (!id) {
            return -1;
        }

        return this.data.findIndex((item) => item && item.id === id);
    }

    /**
     * Return item by specified index
     * Return null in case item can't be found
     * @param {Number} index - index of item to return
     */
    getItemByIndex(index) {
        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.data.length) {
            return null;
        }

        return this.data[ind];
    }

    /**
     * Replace item with same id as specified object
     * @param {Number} index - index of item to update
     */
    updateItem(obj) {
        if (!obj || !obj.id) {
            throw new Error('Invalid item object');
        }

        const ind = this.getItemIndex(obj.id);
        if (ind === null) {
            throw new Error('Item not found');
        }

        this.data[ind] = this.createItem(obj);
    }

    /**
     * Replace item at specified index with new item
     * @param {Number} index - index of item to update
     * @param {Object} obj - index of item to update
     */
    updateItemByIndex(index, obj) {
        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.data.length) {
            throw new Error('Invalid item index');
        }
        if (!obj) {
            throw new Error('Invalid item object');
        }

        this.data[ind] = this.createItem(obj);
    }

    /**
     * Remove item by id
     * @param {Number} itemId - id item to remove
     */
    deleteItem(itemId) {
        const id = parseInt(itemId, 10);
        if (!id) {
            return;
        }

        this.data = this.data.filter((item) => item.id !== id);
    }

    /**
     * Remove item at specified index
     * @param {Number} index - index of item to remove
     */
    deleteItemByIndex(index) {
        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.data.length) {
            throw new Error('Invalid item index');
        }

        this.data.splice(ind, 1);
    }
}
