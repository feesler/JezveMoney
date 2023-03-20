import { SortableList } from './SortableList.js';
import { UserCurrency } from './UserCurrency.js';

export class UserCurrencyList extends SortableList {
    /**
     * Assign new data to the list
     * @param {Array} data - array of list items
     */
    setData(data) {
        super.setData(data);

        this.sort();
    }

    sort() {
        this.data.sort((a, b) => a.pos - b.pos);
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
