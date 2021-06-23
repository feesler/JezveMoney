import { api } from './api.js';

/** Icon object */
export class Icon {
    constructor(props) {
        Object.keys(props).forEach((key) => {
            this[key] = props[key];
        });
    }

    static data = null;

    static async getList() {
        if (!Array.isArray(this.data)) {
            const apiResult = await api.icon.list();
            this.data = apiResult.map((item) => new Icon(item));
        }

        return this.data;
    }

    static async init() {
        await this.getList();
    }

    /** Find item by id */
    static getItem(itemId) {
        if (!Array.isArray(this.data)) {
            throw new Error('List of icons not initialized');
        }

        const res = this.data.find((item) => item.id === itemId);
        if (!res) {
            return null;
        }

        return res;
    }

    /**
    * Try to find icon by name string
    * @param {string} name - icon name
    * @return {Icon}
    */
    static findByName(name) {
        if (!Array.isArray(this.data)) {
            throw new Error('List of icons not initialized');
        }

        const qName = name.toUpperCase();
        const res = this.data.find((item) => item.name && item.name.toUpperCase() === qName);
        if (!res) {
            return null;
        }

        return res;
    }

    /**
    * Try to find icon by title string
    * @param {string} val - icon file name
    * @return {Icon}
    */
    static findByFile(val) {
        if (!Array.isArray(this.data)) {
            throw new Error('List of icons not initialized');
        }

        if (typeof val !== 'string') {
            return null;
        }

        const filename = val.toUpperCase();
        const res = this.data.find((item) => item.file && item.file.toUpperCase() === filename);
        if (!res) {
            return null;
        }

        return res;
    }

    static noIcon() {
        return {
            id: 0,
            name: 'No icon',
            file: null,
            type: null,
        };
    }
}
