import { isFunction } from '@jezvejs/types';
import { createElement } from '@jezvejs/dom';
import { Component } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Popup } from 'jezvejs/Popup';
import { createStore } from 'jezvejs/Store';

import {
    DEFAULT_PAGE_LIMIT,
    __,
} from '../../../utils/utils.js';

import { REMINDER_SCHEDULED } from '../../../Models/Reminder.js';

import { ReminderListGroup } from '../ReminderListGroup/ReminderListGroup.js';

import {
    reducer,
    getInitialState,
    actions,
} from './reducer.js';
import './SelectReminderDialog.scss';

/* CSS classes */
const DIALOG_CLASS = 'select-reminder-dialog';
const HEADER_CLASS = 'dialog-header';

const defaultProps = {
    id: undefined,
    filter: {
        reminderState: REMINDER_SCHEDULED,
        startDate: null,
        endDate: null,
    },
    pagination: {
        onPage: DEFAULT_PAGE_LIMIT,
        page: 1,
        pages: 0,
        range: 1,
    },
    onChange: null,
    onCancel: null,
};

/**
 * Select reminder to confirm by transaction dialog
 */
export class SelectReminderDialog extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            filter: {
                ...defaultProps.filter,
                ...(props.filter ?? {}),
            },
            pagination: {
                ...defaultProps.pagination,
                ...(props.pagination ?? {}),
            },
            listMode: 'singleSelect',
        });

        const initialState = getInitialState(this.props);
        this.store = createStore(reducer, { initialState });

        this.init();
    }

    init() {
        // Header title
        this.titleElem = createElement('label', {
            props: { textContent: __('transactions.selectReminder') },
        });

        // Toggle show/hide filters button
        this.filtersBtn = Button.create({
            id: 'filtersBtn',
            className: 'filters-btn circle-btn',
            icon: 'filter',
            onClick: () => this.listGroup?.toggleFilters(),
        });

        // Header
        this.headerElem = createElement('div', {
            props: { className: HEADER_CLASS },
            children: [
                this.titleElem,
                this.filtersBtn.elem,
            ],
        });

        this.listGroup = ReminderListGroup.create({
            ...this.props,
            filtersId: 'filters',
            stateFilterId: 'stateFilter',
            dateRangeFilterId: 'dateFilter',
            modeSelectorType: 'button',
            listMode: 'singleSelect',
            showControls: false,
            onChange: (selected) => this.onChange(selected),
            onUpdate: (state) => this.updateRemindersList(state),
        });

        this.dialog = Popup.create({
            id: this.props.id,
            title: this.headerElem,
            className: DIALOG_CLASS,
            closeButton: true,
            onClose: () => this.onCancel(),
            content: this.listGroup.elem,
        });
        if (!this.dialog) {
            throw new Error('Failed to create dialog');
        }

        this.elem = this.dialog.elem;

        this.subscribeToStore(this.store);
    }

    /**
     * Shows/hides dialog
     */
    show(value = true) {
        this.listGroup?.update();
        this.dialog.show(value);
    }

    /** Hides dialog */
    hide() {
        this.dialog.hide();
    }

    onChange(selected) {
        if (isFunction(this.props.onChange)) {
            this.props.onChange(selected);
        }
    }

    onCancel() {
        if (isFunction(this.props.onCancel)) {
            this.props.onCancel();
        }
    }

    updateRemindersList(data) {
        this.store.dispatch(actions.updateRemindersList(data));
    }

    renderList(state) {
        this.listGroup.setState((listState) => ({
            ...listState,
            ...state,
        }));
    }

    /** Renders component state */
    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderList(state, prevState);
    }
}
