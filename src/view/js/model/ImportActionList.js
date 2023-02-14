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

    /** Check list has specified action type */
    static findAction(actions, action) {
        const actionType = parseInt(action, 10);
        if (!actionType) {
            throw new Error('Invalid action type');
        }

        return actions.find((item) => (item.action_id === actionType));
    }

    /** Check list has specified action type */
    static hasAction(actions, action) {
        return !!this.findAction(actions, action);
    }

    /** Check list has `Set transaction type` action with 'transfer_out' or 'transfer_in' value */
    static hasSetTransfer(actions) {
        return !!actions.find((item) => (
            item.action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                item.value === 'transfer_out'
                || item.value === 'transfer_in'
            )
        ));
    }

    /** Check list has `Set transaction type` action with 'debt_out' or 'debt_in' value */
    static hasSetDebt(actions) {
        return !!actions.find((item) => (
            item.action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                item.value === 'debt_out'
                || item.value === 'debt_in'
            )
        ));
    }

    /** Returns sorted array of actions */
    static sort(actions) {
        const data = copyObject(actions);
        data.sort((a, b) => a.action_id - b.action_id);
        return data;
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
        return ImportActionList.findAction(this, action);
    }

    /** Check list has specified action type */
    hasAction(action) {
        return ImportActionList.hasAction(this, action);
    }

    /** Check list has `Set transaction type` action with 'transfer_out' or 'transfer_in' value */
    hasSetTransfer() {
        return ImportActionList.hasSetTransfer(this);
    }

    /** Check list has `Set transaction type` action with 'debt_out' or 'debt_in' value */
    hasSetDebt() {
        return ImportActionList.hasSetDebt(this);
    }

    sort() {
        const sorted = ImportActionList.sort(this.data);
        return ImportActionList.create(sorted);
    }
}
