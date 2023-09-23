import {
    isFunction,
    Component,
    createElement,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Popup } from 'jezvejs/Popup';
import { createStore } from 'jezvejs/Store';

import {
    DEFAULT_PAGE_LIMIT,
    __,
    dateStringToTime,
} from '../../../../utils/utils.js';
import { API } from '../../../../API/index.js';
import { App } from '../../../../Application/App.js';

import { REMINDER_SCHEDULED, REMINDER_UPCOMING } from '../../../../Models/Reminder.js';

import { FiltersContainer } from '../../../FiltersContainer/FiltersContainer.js';
import { ReminderFilters } from '../../../ReminderFilters/ReminderFilters.js';
import { ReminderListGroup } from '../../../ReminderListGroup/ReminderListGroup.js';

import {
    reducer,
    actions,
    getStateFilter,
    updateList,
    getInitialState,
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
        });

        const initialState = updateList(getInitialState(this.props));
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
            onClick: () => this.filtersContainer.toggle(),
        });

        // Header
        this.headerElem = createElement('div', {
            props: { className: HEADER_CLASS },
            children: [
                this.titleElem,
                this.filtersBtn.elem,
            ],
        });

        this.filters = ReminderFilters.create({
            id: 'filters',
            stateFilterId: 'stateFilter',
            dateRangeFilterId: 'dateFilter',
            onChangeReminderState: (range) => this.onChangeReminderState(range),
            onChangeDateRange: (range) => this.onChangeDateRange(range),
            onApplyFilters: (e) => this.onApplyFilters(e),
            onClearAllFilters: (e) => this.onClearAllFilters(e),
        });

        this.filtersContainer = FiltersContainer.create({
            content: this.filters.elem,
        });

        this.listGroup = ReminderListGroup.create({
            showControls: false,
            onItemClick: (id, e) => this.onItemClick(id, e),
            onShowMore: (e) => this.showMore(e),
            onChangePage: (page) => this.onChangePage(page),
            onToggleMode: (e) => this.onToggleMode(e),
        });

        this.container = createElement('div', {
            props: {
                className: 'list-container',
            },
            children: [
                this.filtersContainer.elem,
                this.listGroup.elem,
            ],
        });

        this.dialog = Popup.create({
            id: this.props.id,
            title: this.headerElem,
            className: DIALOG_CLASS,
            closeButton: true,
            onClose: () => this.onCancel(),
            content: this.container,
        });
        if (!this.dialog) {
            throw new Error('Failed to create dialog');
        }

        this.elem = this.dialog.elem;

        this.subscribeToStore(this.store);
        this.onPostInit();
    }

    async onPostInit() {
        const state = this.store.getState();
        const stateFilter = getStateFilter(state);

        if (stateFilter === REMINDER_UPCOMING && state.upcomingItems === null) {
            await this.requestUpcoming(this.getUpcomingRequestData());
        }
        this.setRenderTime();
    }

    /** Updates dialog state */
    update() {
        this.store.dispatch(actions.update());
    }

    /** Reset dialog state */
    reset() {
        this.store.dispatch(actions.reset(this.props));
    }

    startLoading(isLoadingMore = false) {
        this.store.dispatch(actions.startLoading(isLoadingMore));
    }

    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    /** Updates render time */
    setRenderTime() {
        this.store.dispatch(actions.setRenderTime());
    }

    /**
     * Shows/hides dialog
     */
    show(value = true) {
        this.update();
        this.dialog.show(value);
    }

    /** Hides dialog */
    hide() {
        this.dialog.hide();
    }

    /**
     * Reminder state filter change callback
     * @param {string} value - selected state types
     */
    async onChangeReminderState(value) {
        const stateFilter = parseInt(value, 10);
        const state = this.store.getState();
        const currentStateFilter = getStateFilter(state);
        if (currentStateFilter === stateFilter) {
            return;
        }

        this.store.dispatch(actions.changeStateFilter(stateFilter));

        if (stateFilter === REMINDER_UPCOMING) {
            await this.requestUpcoming(this.getUpcomingRequestData());
        }

        this.setRenderTime();
    }

    /** Date range filter change handler */
    async onChangeDateRange(range) {
        const { filter } = this.store.getState();
        const startDate = filter.startDate ?? null;
        const endDate = filter.endDate ?? null;
        const timeData = {
            startDate: dateStringToTime(range.startDate, { fixShortYear: false }),
            endDate: dateStringToTime(range.endDate, { fixShortYear: false }),
        };

        if (startDate === timeData.startDate && endDate === timeData.endDate) {
            return;
        }

        this.store.dispatch(actions.changeDateFilter(range));
        if (getStateFilter(this.store.getState()) === REMINDER_UPCOMING) {
            await this.requestUpcoming({
                ...this.getUpcomingRequestData(),
                range: 1,
                page: 1,
                keepState: true,
            });
        }

        this.setRenderTime();
    }

    /** Applies filters and closes Offcanvas */
    onApplyFilters() {
        this.filtersContainer.close();
    }

    /**
     * Clear all filters
     * @param {Event} e - click event object
     */
    async onClearAllFilters(e) {
        e.preventDefault();

        this.store.dispatch(actions.clearAllFilters());
        if (getStateFilter(this.store.getState()) === REMINDER_UPCOMING) {
            await this.requestUpcoming({
                ...this.getUpcomingRequestData(),
                range: 1,
                page: 1,
                keepState: true,
            });
        }

        this.setRenderTime();
    }

    onCancel() {
        if (isFunction(this.props.onCancel)) {
            this.props.onCancel();
        }
    }

    onItemClick(id) {
        if (!isFunction(this.props.onChange)) {
            return;
        }

        const strId = id?.toString() ?? null;
        if (strId === null) {
            return;
        }

        const state = this.store.getState();
        const reminder = state.items.find((item) => item.id?.toString() === strId);
        if (!reminder) {
            return;
        }

        const isUpcoming = (reminder.state === REMINDER_UPCOMING);
        const selected = {
            schedule_id: reminder.schedule_id,
            reminder_date: reminder.date,
            reminder_id: (isUpcoming) ? null : reminder.id,
        };

        this.props.onChange(selected);
    }

    async showMore() {
        const state = this.store.getState();
        const isUpcoming = getStateFilter(state) === REMINDER_UPCOMING;

        if (!isUpcoming) {
            this.store.dispatch(actions.showMore());
            this.setRenderTime();
            return;
        }

        const { page } = state.pagination;
        let { range } = state.pagination;
        if (!range) {
            range = 1;
        }
        range += 1;

        await this.requestUpcoming({
            ...this.getUpcomingRequestData(),
            range,
            page,
            keepState: true,
            isLoadingMore: true,
        });

        this.setRenderTime();
    }

    getUpcomingRequestData() {
        const { pagination, form } = this.store.getState();

        const res = {
            page: pagination.page,
            range: pagination.range,
        };

        if (form.startDate) {
            res.startDate = dateStringToTime(form.startDate, { fixShortYear: false });
        }
        if (form.endDate) {
            res.endDate = dateStringToTime(form.endDate, { fixShortYear: false });
        }

        return res;
    }

    async requestUpcoming(options = {}) {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const {
            keepState = false,
            isLoadingMore = false,
            ...request
        } = options;

        this.startLoading(isLoadingMore);

        try {
            const { data: upcoming } = await API.reminder.upcoming(request);
            this.store.dispatch(actions.listRequestLoaded({ upcoming, keepState }));
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    onChangePage(page) {
        this.store.dispatch(actions.changePage(page));
        this.setRenderTime();
    }

    onToggleMode(e) {
        e.preventDefault();

        this.store.dispatch(actions.toggleMode());
        this.setRenderTime();
    }

    renderFilters(state) {
        this.filters.setState((filtersState) => ({
            ...filtersState,
            ...state,
        }));
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

        this.renderFilters(state, prevState);
        this.renderList(state, prevState);
    }
}
