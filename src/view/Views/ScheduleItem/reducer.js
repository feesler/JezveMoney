import { createSlice } from 'jezvejs/Store';

// Reducers
const slice = createSlice({
    startSubmit: (state) => ({ ...state, submitStarted: true }),
    cancelSubmit: (state) => ({ ...state, submitStarted: false }),
    changeScheduleItem: (state, scheduleItem) => ({
        ...state,
        scheduleItem: { ...scheduleItem },
    }),
});

export const { actions, reducer } = slice;
