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

    defaultSort() {
        const data = structuredClone(this);
        data.sort((a, b) => a.action_id - b.action_id);
        return ImportActionList.create(data);
    }
}
