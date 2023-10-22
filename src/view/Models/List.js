/**
 * Base List class
 * @param {object[]} props - array of list items
 */
export class List extends Array {
    static create(props = []) {
        const instance = new this(props);
        instance.setData(props);
        return instance;
    }

    /**
     * Assign new data to the list
     * @param {Array} data - array of list items
     */
    setData(data = []) {
        if (!Array.isArray(data)) {
            throw new Error('Invalid list props');
        }

        this.splice(0, this.length, ...data.map(this.createItem.bind(this)));
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
        this.push(this.createItem(obj));
    }

    /**
     * Return item with specified id
     * @param {Number} itemId - identifier of item to find
     */
    getItem(itemId) {
        const strId = itemId?.toString() ?? null;
        if (strId === null) {
            return null;
        }

        return this.find((item) => item && item.id.toString() === strId);
    }

    /**
     * Return index of item with specified id
     * Return -1 in case item can't be found
     * @param {Number} itemId - identifier of item to find
     */
    getItemIndex(itemId) {
        const strId = itemId?.toString() ?? null;
        if (strId === null) {
            return -1;
        }

        return this.findIndex((item) => item && item.id.toString() === strId);
    }

    /**
     * Return item by specified index
     * Return null in case item can't be found
     * @param {Number} index - index of item to return
     */
    getItemByIndex(index) {
        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.length) {
            return null;
        }

        return this[ind];
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

        this[ind] = this.createItem(obj);
    }

    /**
     * Replace item at specified index with new item
     * @param {Number} index - index of item to update
     * @param {Object} obj - index of item to update
     */
    updateItemByIndex(index, obj) {
        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.length) {
            throw new Error('Invalid item index');
        }
        if (!obj) {
            throw new Error('Invalid item object');
        }

        this[ind] = this.createItem(obj);
    }

    /**
     * Remove item by id
     * @param {Number} itemId - id item to remove
     */
    deleteItem(itemId) {
        const index = this.getItemIndex(itemId);
        if (index !== -1) {
            this.deleteItemByIndex(index);
        }
    }

    /**
     * Remove item at specified index
     * @param {Number} index - index of item to remove
     */
    deleteItemByIndex(index) {
        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind >= this.length) {
            throw new Error('Invalid item index');
        }

        this.splice(ind, 1);
    }
}
