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
} from '../../../utils/utils.js';
import { API } from '../../../API/index.js';
import { App } from '../../../Application/App.js';

import { REMINDER_SCHEDULED, REMINDER_UPCOMING } from '../../../Models/Reminder.js';

import { ReminderListGroup } from '../ReminderListGroup/ReminderListGroup.js';

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
            filtersId: 'filters',
            stateFilterId: 'stateFilter',
            dateRangeFilterId: 'dateFilter',
            modeSelectorType: 'button',
            showControls: false,
            onChangeReminderState: (range) => this.onChangeReminderState(range),
            onChangeDateRange: (range) => this.onChangeDateRange(range),
            onClearAllFilters: (e) => this.onClearAllFilters(e),
            onItemClick: (id, e) => this.onItemClick(id, e),
            onShowMore: (e) => this.showMore(e),
            onChangePage: (page) => this.onChangePage(page),
            onChangeMode: (mode) => this.onChangeMode(mode),
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

    onChangePage(page) {
        this.store.dispatch(actions.changePage(page));
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

    onChangeMode(mode) {
        const state = this.store.getState();
        if (state.mode === mode) {
            return;
        }

        this.store.dispatch(actions.toggleMode());
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
