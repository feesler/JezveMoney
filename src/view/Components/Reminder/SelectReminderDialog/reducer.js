import { createSlice } from 'jezvejs/Store';
import { formatDateRange } from '../../../utils/utils.js';

/** Returns initial state object */
export const getInitialState = (props = {}) => ({
    ...props,
    form: {
        ...(props?.filter ?? {}),
        ...formatDateRange(props?.filter ?? {}),
    },
    listMode: 'singleSelect',
});

const slice = createSlice({
    updateRemindersList: (state, data) => ({
        ...state,
        ...data,
    }),
});

export const { actions, reducer } = slice;
