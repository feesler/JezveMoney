import { SortableListModel } from './SortableListModel.js';
import { UserCurrency } from './UserCurrency.js';

/**
 * User currencies list model class
 */
export class UserCurrencyListModel extends SortableListModel {
    defaultSort() {
        this.sort((a, b) => a.pos - b.pos);
    }

    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new UserCurrency(obj);
    }

    /** Searches for user currency entry by specified currency id and returns result */
    findByCurrency(currencyId) {
        const currId = parseInt(currencyId, 10);
        if (!currId) {
            return null;
        }

        return this.find((item) => item.curr_id === currId);
    }
}
