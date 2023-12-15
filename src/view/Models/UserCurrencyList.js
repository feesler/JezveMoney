import { List } from './List.js';
import { UserCurrency } from './UserCurrency.js';

/**
 * @constructor UserCurrencyList class
 * @param {object[]} props - array of user currencies
 */
export class UserCurrencyList extends List {
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

    defaultSort() {
        this.sortByPosAsc();
    }

    /**
     * Sort items by ascending position
     */
    sortByPosAsc() {
        this.sort((a, b) => a.pos - b.pos);
    }

    /**
     * Sort items by descending position
     */
    sortByPosDesc() {
        this.sort((a, b) => b.pos - a.pos);
    }
}
