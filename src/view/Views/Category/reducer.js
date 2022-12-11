import { createSlice } from '../../js/store.js';

// Reducers
const slice = createSlice({
    changeName: (state, value) => ({
        ...state,
        validation: {
            ...state.validation,
            name: true,
            valid: true,
        },
        data: {
            ...state.data,
            name: value,
        },
    }),

    changeParent: (state, value) => (
        (state.data.parent_id === value)
            ? state
            : {
                ...state,
                data: {
                    ...state.data,
                    parent_id: value,
                },
            }
    ),

    changeType: (state, type) => (
        (state.data.type === type)
            ? state
            : {
                ...state,
                data: {
                    ...state.data,
                    type,
                },
            }
    ),

    invalidateNameField: (state, message) => ({
        ...state,
        validation: {
            ...state.validation,
            name: message,
            valid: false,
        },
    }),

    startSubmit: (state) => ({
        ...state,
        submitStarted: true,
    }),

    cancelSubmit: (state) => ({
        ...state,
        submitStarted: false,
    }),
});

export const { actions, reducer } = slice;
