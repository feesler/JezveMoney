import { App } from '../../Application/App.js';
import { getApplicationURL } from '../../utils/utils.js';

/** Returns true if specified arrays contains same set of values */
export const isSameSelection = (a, b) => (
    a.length === b.length && a.every((id) => b.includes(id))
);

/** Returns transactions group by date setting value */
export const getTransactionsGroupByDate = () => (
    App.model.profile.settings.tr_group_by_date
);

/** Returns export transactions URL */
export const getExportURL = (state) => (
    getApplicationURL('transactions/export/', state.filter)
);
