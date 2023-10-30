import { isFunction } from '@jezvejs/types';
import { createElement } from '@jezvejs/dom';
import { Component } from 'jezvejs';
import { LinkMenu } from 'jezvejs/LinkMenu';

import { App } from '../../../Application/App.js';
import {
    __,
    formatDateRange,
} from '../../../utils/utils.js';

import {
    REMINDER_CANCELLED,
    REMINDER_CONFIRMED,
    REMINDER_SCHEDULED,
    REMINDER_UPCOMING,
    Reminder,
} from '../../../Models/Reminder.js';

import { DateRangeField } from '../../Form/Fields/DateRangeField/DateRangeField.js';
import { FormControls } from '../../Form/FormControls/FormControls.js';

import './ReminderFilters.scss';

/* CSS classes */
const CONTAINER_CLASS = 'filters-container';
const HEADER_CLASS = 'filters-heading';
const TITLE_CLASS = 'filters-heading__title';
const SEPARATOR_CLASS = 'filters-separator';
const FILTERS_CLASS = 'filters-list';
const FILTERS_ROW_CLASS = 'filters-row';
const FILTER_TITLE_CLASS = 'filter-item__title';
const STATE_FILTER_CLASS = 'filter-item trans-type-filter';
const DATE_FILTER_CLASS = 'filter-item validation-block';
const CONTROLS_CLASS = 'filters-controls';
const CLEAR_ALL_BUTTON_CLASS = 'clear-all-btn';

const filtersSeparator = () => (
    createElement('hr', { props: { className: SEPARATOR_CLASS } })
);

const defaultProps = {
    id: undefined,
    stateFilterId: undefined,
    dateRangeFilterId: undefined,
    filter: {
        reminderState: REMINDER_SCHEDULED,
        startDate: null,
        endDate: null,
    },
    getURL: null,
    onChangeDateRange: null,
    onChangeReminderState: null,
    onClearAllFilters: null,
};

/**
 * Reminders list filter component
 */
export class ReminderFilters extends Component {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            filter: {
                ...defaultProps.filter,
                ...(props.filter ?? {}),
            },
        });

        const filter = this.props.filter ?? {};

        this.state = {
            ...this.props,
            form: {
                ...filter,
                ...formatDateRange(filter),
            },
        };

        this.init();
        this.postInit();
        this.render(this.state);
    }

    init() {
        this.titleElem = createElement('header', {
            props: {
                className: TITLE_CLASS,
                textContent: __('filters.title'),
            },
        });
        this.headerElem = createElement('header', {
            props: { className: HEADER_CLASS },
            children: this.titleElem,
        });

        // State filter
        this.stateMenu = LinkMenu.create({
            id: 'stateMenu',
            itemParam: 'state',
            defaultItemType: this.props.getURL ? 'link' : 'button',
            items: [
                { id: REMINDER_SCHEDULED, title: __('reminders.state.scheduled') },
                { id: REMINDER_UPCOMING, title: __('reminders.state.upcoming') },
                { id: REMINDER_CONFIRMED, title: __('reminders.state.submitted') },
                { id: REMINDER_CANCELLED, title: __('reminders.state.cancelled') },
            ],
            onChange: (value) => this.onChangeReminderState(value),
        });
        this.stateFilter = createElement('section', {
            props: {
                id: this.props.stateFilterId,
                className: STATE_FILTER_CLASS,
            },
            children: [
                createElement('header', {
                    props: {
                        className: FILTER_TITLE_CLASS,
                        textContent: __('filters.reminderState'),
                    },
                }),
                this.stateMenu.elem,
            ],
        });

        // Date range filter
        this.dateRangeFilter = DateRangeField.create({
            id: this.props.dateRangeFilterId,
            title: __('filters.dateRange'),
            input: {
                startPlaceholder: __('dateRange.from'),
                endPlaceholder: __('dateRange.to'),
            },
            className: DATE_FILTER_CLASS,
            onChange: (range) => this.onChangeDateRange(range),
        });

        this.filtersElem = createElement('div', {
            props: { className: FILTERS_CLASS },
            children: createElement('div', {
                props: { className: FILTERS_ROW_CLASS },
                children: [
                    this.stateFilter,
                    filtersSeparator(),
                    this.dateRangeFilter.elem,
                ],
            }),
        });

        // Controls
        this.controls = FormControls.create({
            className: CONTROLS_CLASS,
            submitBtn: {
                type: 'button',
                title: __('actions.apply'),
                onClick: (e) => this.onApplyFilters(e),
            },
            cancelBtn: {
                title: __('actions.clearAll'),
                className: CLEAR_ALL_BUTTON_CLASS,
                onClick: (e) => this.onClearAllFilters(e),
            },
        });

        // Container
        this.elem = createElement('aside', {
            props: { className: CONTAINER_CLASS },
            children: [
                this.headerElem,
                filtersSeparator(),
                this.filtersElem,
                this.controls.elem,
            ],
        });
    }

    postInit() {
        this.setClassNames();
        this.setUserProps();
    }

    onChangeReminderState(reminderState) {
        if (isFunction(this.props.onChangeReminderState)) {
            this.props.onChangeReminderState(reminderState);
        }
    }

    onChangeDateRange(range) {
        if (isFunction(this.props.onChangeDateRange)) {
            this.props.onChangeDateRange(range);
        }
    }

    onApplyFilters(e) {
        if (isFunction(this.props.onApplyFilters)) {
            this.props.onApplyFilters(e);
        }
    }

    onClearAllFilters(e) {
        if (isFunction(this.props.onClearAllFilters)) {
            this.props.onClearAllFilters(e);
        }
    }

    /** Returns URL for specified state */
    getURL(state, keepPage = true) {
        return isFunction(this.props.getURL)
            ? this.props.getURL(state, keepPage)
            : '';
    }

    renderStateFilter(state, prevState) {
        if (
            state.filter === prevState?.filter
            && state.form === prevState?.form
            && state.form.reminderState === prevState?.form?.reminderState
        ) {
            return;
        }

        const filterUrl = this.getURL(state, false);

        this.stateMenu.setURL(filterUrl);
        this.stateMenu.setSelection(state.filter.reminderState);
    }

    renderDateRangeFilter(state, prevState) {
        if (
            state.filter === prevState?.filter
            && state.form === prevState?.form
            && state.form.startDate === prevState?.form?.startDate
            && state.form.endDate === prevState?.form?.endDate
        ) {
            return;
        }

        this.dateRangeFilter.setState((rangeState) => ({
            ...rangeState,
            startDate: state.form.startDate,
            endDate: state.form.endDate,
        }));
    }

    renderControls(state, prevState) {
        if (
            state.filter === prevState?.filter
            && state.form === prevState?.form
            && state.form.reminderState === prevState?.form?.reminderState
        ) {
            return;
        }

        const { filter } = state;
        const clearAllURLParams = {};

        if (filter.state !== REMINDER_SCHEDULED) {
            clearAllURLParams.state = Reminder.getStateName(filter.reminderState);
        }

        const clearAllURL = App.getURL('reminders/', clearAllURLParams);
        this.controls.setState((controlsState) => ({
            ...controlsState,
            cancelBtn: {
                ...controlsState.cancelBtn,
                url: clearAllURL.toString(),
            },
        }));
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (
            state.filter === prevState?.filter
            && state.form === prevState?.form
            && state.form.reminderState === prevState?.form?.reminderState
            && state.form.startDate === prevState?.form?.startDate
            && state.form.endDate === prevState?.form?.endDate
        ) {
            return;
        }

        this.renderStateFilter(state, prevState);
        this.renderDateRangeFilter(state, prevState);
        this.renderControls(state, prevState);
    }
}
