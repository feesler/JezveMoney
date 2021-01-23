import { List } from './list.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    ImportAction,
} from './importaction.js';

export class ImportActionList extends List {
    setData(data) {
        this.data = data.map((item) => new ImportAction(item));
    }

    /** Check list has `Set transaction type` action with 'transferfrom' or 'transferto' value */
    hasSetTransfer() {
        return !!this.data.find((item) => (
            item.action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                item.value === 'transferfrom'
                || item.value === 'transferto'
            )
        ));
    }

    /** Check list has `Set transaction type` action with 'debtfrom' or 'debtto' value */
    hasSetDebt() {
        return !!this.data.find((item) => (
            item.action_id === IMPORT_ACTION_SET_TR_TYPE
            && (
                item.value === 'debtfrom'
                || item.value === 'debtto'
            )
        ));
    }
}
