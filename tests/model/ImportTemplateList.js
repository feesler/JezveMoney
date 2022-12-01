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
        this.data = this.map((item) => (
            (itemIds.includes(item.account_id))
                ? { ...item, account_id: 0 }
                : item
        ));
    }

    /** Find valid template for data */
    findValidTemplate(data) {
        return this.find((template) => template.isValid(data));
    }
}
