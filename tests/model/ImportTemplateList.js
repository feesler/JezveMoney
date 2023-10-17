import { asArray } from 'jezve-test';
import { List } from './List.js';
import { ImportTemplate } from './ImportTemplate.js';

export class ImportTemplateList extends List {
    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new ImportTemplate(obj);
    }

    /** Updates templates on delete accounts */
    deleteAccounts(accountIds) {
        const ids = asArray(accountIds);
        if (!ids.length) {
            return;
        }

        const itemIds = ids.map((id) => parseInt(id, 10));
        const data = this.map((item) => (
            (itemIds.includes(item.account_id))
                ? { ...item, account_id: 0 }
                : item
        ));

        this.setData(data);
    }

    /** Searches for import template by name and returns result */
    findByName(name, caseSens = false) {
        let lookupName;

        if (caseSens) {
            lookupName = name;
            return this.find((item) => item.name === lookupName);
        }

        lookupName = name.toLowerCase();
        return this.find((item) => item.name.toLowerCase() === lookupName);
    }

    /** Find valid template for data */
    findValidTemplate(data) {
        return this.find((template) => template.isValid(data));
    }

    /** Validates template for specified data and returns result */
    isValidTemplate(template, data) {
        const valid = template?.isValid(data);
        if (!valid) {
            return false;
        }

        const foundItem = this.findByName(template.name);
        if (foundItem && foundItem.id !== template.id) {
            return false;
        }

        return true;
    }
}
