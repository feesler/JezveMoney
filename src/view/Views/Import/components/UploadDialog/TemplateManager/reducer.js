import { createSlice } from 'jezvejs/Store';

import { IMPORT_DATE_LOCALE, ImportTemplate } from '../../../../../Models/ImportTemplate.js';
import { validateTemplate } from './helpers.js';

/** States */
export const LOADING_STATE = 1;
export const TPL_SELECT_STATE = 2;
export const TPL_CREATE_STATE = 3;
export const TPL_UPDATE_STATE = 4;

export const defaultValidation = {
    name: true,
    firstRow: true,
    valid: true,
    columns: true,
};

const slice = createSlice({
    show: (state) => (
        (state.visible) ? state : { ...state, visible: true }
    ),

    hide: (state) => (
        (state.visible) ? { ...state, visible: false } : state
    ),

    setLoading: (state) => (
        (state.id !== LOADING_STATE) ? { ...state, id: LOADING_STATE } : state
    ),

    setSelectTemplateState: (state) => (
        (state.id !== TPL_SELECT_STATE) ? { ...state, id: TPL_SELECT_STATE } : state
    ),

    setCreateTemplateState: (state) => (
        (state.id === TPL_CREATE_STATE)
            ? state
            : {
                ...state,
                id: TPL_CREATE_STATE,
                template: new ImportTemplate({
                    name: '',
                    type_id: 0,
                    account_id: 0,
                    first_row: 2,
                    date_locale: IMPORT_DATE_LOCALE,
                    columns: {},
                }),
                validation: {
                    ...defaultValidation,
                },
            }
    ),

    setUpdateTemplateState: (state) => (
        (state.id !== TPL_UPDATE_STATE) ? { ...state, id: TPL_UPDATE_STATE } : state
    ),

    reset: (state) => ({
        ...state,
        id: LOADING_STATE,
        visible: false,
        rawData: null,
        filename: null,
        rowsToShow: 3,
        listLoading: false,
        formRequest: null,
        template: null,
        selectedTemplateId: 0,
    }),

    setFileData: (state, { data, filename }) => ({
        ...state,
        rawData: structuredClone(data),
        filename,
    }),

    selectTemplate: (state, selectedTemplateId) => ({
        ...state,
        selectedTemplateId,
    }),

    updateTemplates: (state, templates) => ({
        ...state,
        templates,
    }),

    setMainAccount: (state, mainAccount) => ({
        ...state,
        mainAccount,
    }),

    startListLoading: (state, formRequest = null) => ({
        ...state,
        listLoading: true,
        formRequest,
    }),

    stopListLoading: (state) => ({
        ...state,
        listLoading: false,
        formRequest: null,
    }),

    setTemplate: (state, template) => {
        const validation = validateTemplate(template, state.rawData);
        const newState = {
            ...state,
            template,
            validation: {
                ...state.validation,
                ...validation,
            },
        };

        if (!validation.valid && typeof validation.column === 'string') {
            newState.selectedColumn = validation.column;
        }

        return newState;
    },

    showDeleteConfirmDialog: (state) => {
        if (state.showDeleteConfirmDialog) {
            return state;
        }

        return {
            ...state,
            showDeleteConfirmDialog: true,
        };
    },

    hideDeleteConfirmDialog: (state) => (
        (state.showDeleteConfirmDialog)
            ? { ...state, showDeleteConfirmDialog: false }
            : state
    ),
});

export const { actions, reducer } = slice;
