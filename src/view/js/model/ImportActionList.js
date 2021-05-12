import { List } from './List.js';
import {
    ImportAction,
    IMPORT_ACTION_SET_TR_TYPE,
} from './ImportAction.js';

/* eslint no-bitwise: "off" */

/**
 * Import actions list class
 * @param {object[]} props - array of import action
 */
export class ImportActionList extends List {
    /** Static alias for ImportActionList constructor */
    static create(props) {
        return new ImportActionList(props);
    }

    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new ImportAction(obj);
    }

    /**
     * Return list of actions for specified rule
     * @param {number} ruleId - rule id
     */
    getRuleActions(ruleId) {
        const id = parseInt(ruleId, 10);
        if (!id) {
            throw new Error('Invalid rule id');
        }

        return this.filter((item) => item.rule_id === id);
    }

    /** Check list has `Set transaction type` action with 'transferfrom' or 'transferto' value */
    hasSetTransfer() {
        return !!this.find((item) => (
            item.action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                item.value === 'transferfrom'
                || item.value === 'transferto'
            )
        ));
    }

    /** Check list has `Set transaction type` action with 'debtfrom' or 'debtto' value */
    hasSetDebt() {
        return !!this.find((item) => (
            item.action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                item.value === 'debtfrom'
                || item.value === 'debtto'
            )
        ));
    }
}
