import { createSlice } from 'jezvejs/Store';
import { App } from '../../Application/App.js';

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

    changeColor: (state, color) => ({
        ...state,
        data: {
            ...state.data,
            color,
        },
        validation: {
            ...state.validation,
            color: true,
            valid: true,
        },
    }),

    changeParent: (state, value) => {
        if (state.data.parent_id === value) {
            return state;
        }

        const { categories } = App.model;
        const parent = categories.getItem(value);
        const parentId = parseInt(value, 10);
        if (parentId !== 0 && !parent) {
            return state;
        }

        return {
            ...state,
            data: {
                ...state.data,
                parent_id: value,
                type: (parentId === 0) ? state.data.type : parent.type,
                color: (parentId === 0) ? state.data.color : parent.color,
            },
            validation: {
                ...state.validation,
                color: true,
                valid: true,
            },
        };
    },

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

    invalidateColorField: (state, message = false) => ({
        ...state,
        validation: {
            ...state.validation,
            color: message,
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
