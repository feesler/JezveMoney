import { copyObject } from 'jezvejs';
import { List } from './List.js';
import {
    ImportAction,
    IMPORT_ACTION_SET_TR_TYPE,
} from './ImportAction.js';

/**
 * Import actions list class
 * @param {object[]} props - array of import action
 */
export class ImportActionList extends List {
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

    /** Check list of actions match search query */
    isMatchFilter(value) {
        return this.some((action) => action.isMatchFilter(value));
    }

    /** Check list has specified action type */
    findAction(action) {
        const actionType = parseInt(action, 10);
        if (!actionType) {
            throw new Error('Invalid action type');
        }

        return this.find((item) => (item.action_id === actionType));
    }

    /** Check list has specified action type */
    hasAction(action) {
        return !!this.findAction(action);
    }

    /** Check list has `Set transaction type` action with 'transfer_out' or 'transfer_in' value */
    hasSetTransfer() {
        return !!this.find((item) => (
            item.action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                item.value === 'transfer_out'
                || item.value === 'transfer_in'
            )
        ));
    }

    /** Check list has `Set transaction type` action with 'debt_out' or 'debt_in' value */
    hasSetDebt() {
        return !!this.find((item) => (
            item.action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                item.value === 'debt_out'
                || item.value === 'debt_in'
            )
        ));
    }

    sort() {
        const data = copyObject(this.data);
        data.sort((a, b) => a.action_id - b.action_id);
        return ImportActionList.create(data);
    }
}
