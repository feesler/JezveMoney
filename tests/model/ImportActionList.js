import { copyObject } from 'jezve-test';
import { List } from './List.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    ImportAction,
} from './ImportAction.js';

export class ImportActionList extends List {
    /** Convert object to ImportAction */
    createItem(obj) {
        return new ImportAction(obj);
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

    sort() {
        const data = copyObject(this.data);
        data.sort((a, b) => a.action_id - b.action_id);
        return ImportActionList.create(data);
    }
}
