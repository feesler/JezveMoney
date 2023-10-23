import {
    Component,
    createElement,
    isFunction,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { ListContainer } from 'jezvejs/ListContainer';
import { Paginator } from 'jezvejs/Paginator';
import { Spinner } from 'jezvejs/Spinner';
import { createStore } from 'jezvejs/Store';

// Application
import {
    __,
    dateStringToTime,
    getSelectedItems,
} from '../../../utils/utils.js';

// Models
import { REMINDER_SCHEDULED, REMINDER_UPCOMING, Reminder } from '../../../Models/Reminder.js';

// Common components
import { LoadingIndicator } from '../../Common/LoadingIndicator/LoadingIndicator.js';
import { NoDataMessage } from '../../Common/NoDataMessage/NoDataMessage.js';
import { ListCounter } from '../../List/ListCounter/ListCounter.js';
import { ToggleDetailsButton } from '../../List/ToggleDetailsButton/ToggleDetailsButton.js';
import { FiltersContainer } from '../../List/FiltersContainer/FiltersContainer.js';
import { ReminderFilters } from '../ReminderFilters/ReminderFilters.js';
import { ReminderListItem } from '../ReminderListItem/ReminderListItem.js';

import {
    reducer,
    actions,
    getStateFilter,
    getInitialState,
    updateList,
} from './reducer.js';
import { requestUpcoming } from './actions.js';
import { getUpcomingRequestData } from './helpers.js';
import './ReminderListGroup.scss';

/* CSS classes */
const LIST_CLASS = 'reminder-list';
const DETAILS_CLASS = 'reminder-list_details';
const SELECT_MODE_CLASS = 'list_select';
const ITEMS_COUNTER_CLASS = 'items-counter';
const SELECTED_COUNTER_CLASS = 'selected-counter';

const defaultProps = {
    items: [],
    filter: {
        reminderState: REMINDER_SCHEDULED,
        startDate: null,
        endDate: null,
    },
    filtersId: undefined,
    stateFilterId: undefined,
    dateRangeFilterId: undefined,
    mode: 'classic', // 'classic' or 'details'
    listMode: 'list', // 'list', 'select' or 'singleSelect'
    modeSelectorType: 'link',
    showControls: true,
    onItemClick: null,
    getURL: null,
    onShowMore: null,
    onChange: null,
    onUpdate: null,
    showContextMenu: null,
    onChangePage: null,
    onChangeMode: null,
    onChangeDateRange: null,
    onChangeReminderState: null,
    onClearAllFilters: null,
};

/**
 * Reminders list group coomponent
 */
export class ReminderListGroup extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        const initialState = updateList(getInitialState(this.props));
        this.store = createStore(reducer, { initialState });

        this.init();
        this.onPostInit();
    }

    get useURL() {
        return isFunction(this.props.getURL);
    }

    get state() {
        return this.store.getState();
    }

    init() {
        this.filters = ReminderFilters.create({
            id: this.state.filtersId,
            stateFilterId: this.state.stateFilterId,
            dateRangeFilterId: this.state.dateRangeFilterId,
            getURL: (state, keepPage) => this.getURL(state, keepPage),
            onChangeReminderState: (range) => this.onChangeReminderState(range),
            onChangeDateRange: (range) => this.onChangeDateRange(range),
            onApplyFilters: (e) => this.onApplyFilters(e),
            onClearAllFilters: (e) => this.onClearAllFilters(e),
        });

        this.filtersContainer = FiltersContainer.create({
            content: this.filters.elem,
        });

        this.reminderList = ListContainer.create({
            ItemComponent: ReminderListItem,
            getItemProps: (item, state) => ({
                item: Reminder.createExtended(item),
                selected: item.selected,
                listMode: state.listMode,
                mode: state.mode,
                showControls: state.showControls,
            }),
            isListChanged: (state, prevState) => (
                state.items !== prevState.items
                || state.mode !== prevState.mode
                || state.listMode !== prevState.listMode
                || state.showControls !== prevState.showControls
            ),
            className: LIST_CLASS,
            itemSelector: ReminderListItem.selector,
            selectModeClass: SELECT_MODE_CLASS,
            placeholderClass: 'list-item_placeholder',
            listMode: 'list',
            PlaceholderComponent: NoDataMessage,
            getPlaceholderProps: () => ({ title: __('reminders.noData') }),
            onItemClick: (id, e) => this.onItemClick(id, e),
        });

        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });

        this.container = createElement('div', {
            props: { className: 'list-container' },
            children: [
                this.reminderList.elem,
                this.loadingIndicator.elem,
            ],
        });

        // List header
        // Counters
        this.itemsCounter = ListCounter.create({
            title: __('list.itemsCounter'),
            className: ITEMS_COUNTER_CLASS,
        });
        this.selectedCounter = ListCounter.create({
            title: __('list.selectedItemsCounter'),
            className: SELECTED_COUNTER_CLASS,
        });

        this.counters = createElement('div', {
            props: { className: 'counters' },
            children: [
                this.itemsCounter.elem,
                this.selectedCounter.elem,
            ],
        });

        // List mode selected
        this.modeSelector = ToggleDetailsButton.create({
            defaultItemType: this.props.modeSelectorType,
            onChange: (value) => this.onChangeMode(value),
        });

        const listHeader = createElement('header', {
            props: { className: 'list-header' },
            children: [this.counters, this.modeSelector.elem],
        });

        const contentHeader = createElement('header', {
            props: { className: 'content-header' },
            children: [this.filtersContainer.elem, listHeader],
        });

        // List footer
        // 'Show more' button
        this.spinner = Spinner.create({ className: 'request-spinner' });
        this.spinner.hide();
        this.showMoreBtn = Button.create({
            className: 'show-more-btn',
            title: __('actions.showMore'),
            onClick: (e) => this.onShowMore(e),
        });

        // Paginator
        this.paginator = Paginator.create({
            arrows: true,
            breakLimit: 3,
            onChange: (page) => this.onChangePage(page),
        });

        this.footer = createElement('div', {
            props: { className: 'list-footer' },
            children: [
                this.showMoreBtn.elem,
                this.spinner.elem,
                this.paginator.elem,
            ],
        });

        this.elem = createElement('section', {
            props: { className: 'list-container' },
            children: [
                contentHeader,
                this.container,
                this.footer,
            ],
        });
    }

    async onPostInit() {
        this.subscribeToStore(this.store);

        this.setClassNames();
        this.setUserProps();

        const state = this.store.getState();
        const stateFilter = getStateFilter(state);

        if (stateFilter === REMINDER_UPCOMING && state.upcomingItems === null) {
            this.store.dispatch(requestUpcoming({
                ...getUpcomingRequestData(state),
                keepState: true,
            }));
        }
        this.setRenderTime();
        this.notifyUpdate();
    }

    notifyUpdate() {
        if (isFunction(this.props.onUpdate)) {
            this.props.onUpdate(this.state);
        }
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

    showContextMenu(itemId) {
        if (isFunction(this.props.showContextMenu)) {
            this.props.showContextMenu(itemId);
        }
    }

    toggleSelectItem(itemId) {
        this.store.dispatch(actions.toggleSelectItem(itemId));
        this.notifyUpdate();
    }

    /** Returns absolute index for relative index on current page */
    getAbsoluteIndex(index, state) {
        if (index === -1) {
            return index;
        }

        const { pagination } = state;
        if (!pagination) {
            return index;
        }

        const firstItemIndex = (pagination.page - 1) * pagination.onPage;
        return firstItemIndex + index;
    }

    /** Returns page number of paginator */
    getPageNum(state = this.state) {
        const range = state.pagination.range ?? 1;
        return state.pagination.page + range - 1;
    }

    /** Returns URL for specified state */
    getURL(state, keepPage = true) {
        return (this.useURL) ? this.props.getURL(state, keepPage) : '';
    }

    toggleFilters() {
        this.filtersContainer.toggle();
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
            this.store.dispatch(requestUpcoming({
                ...getUpcomingRequestData(state),
                keepState: true,
            }));
        }

        this.setRenderTime();
        this.notifyUpdate();
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

        const state = this.store.getState();
        if (getStateFilter(state) === REMINDER_UPCOMING) {
            this.store.dispatch(requestUpcoming({
                ...getUpcomingRequestData(state),
                range: 1,
                page: 1,
                keepState: true,
            }));
        }

        this.setRenderTime();
        this.notifyUpdate();
    }

    onApplyFilters(e) {
        this.filtersContainer.close();

        if (isFunction(this.props.onApplyFilters)) {
            this.props.onApplyFilters(e);
        }
    }

    /**
     * Clear all filters
     * @param {Event} e - click event object
     */
    async onClearAllFilters(e) {
        e.preventDefault();

        this.store.dispatch(actions.clearAllFilters());

        const state = this.store.getState();
        if (getStateFilter(state) === REMINDER_UPCOMING) {
            this.store.dispatch(requestUpcoming({
                ...getUpcomingRequestData(state),
                range: 1,
                page: 1,
                keepState: true,
            }));
        }

        this.setRenderTime();
        this.notifyUpdate();
    }

    onItemClick(id, e) {
        const { listMode } = this.store.getState();
        if (listMode === 'list') {
            this.onListItemClick(id, e);
        } else if (listMode === 'select') {
            this.onSelectItemClick(id, e);
        } else if (listMode === 'singleSelect') {
            this.onSingleSelectItemClick(id, e);
        }
    }

    onListItemClick(id, e) {
        const menuBtn = e?.target?.closest('.menu-btn');
        if (menuBtn) {
            this.showContextMenu(id);
        }
    }

    onSelectItemClick(id, e) {
        if (e?.target?.closest('.checkbox') && e.pointerType !== '') {
            e.preventDefault();
        }

        this.toggleSelectItem(id);
    }

    onSingleSelectItemClick(id) {
        if (!isFunction(this.props.onChange)) {
            return;
        }

        const strId = id?.toString() ?? null;
        if (strId === null) {
            return;
        }

        const { items } = this.store.getState();
        const reminder = items.find((item) => item.id?.toString() === strId);
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

    /** 'Show more' button 'click' event handler */
    async onShowMore() {
        const state = this.store.getState();
        const isUpcoming = getStateFilter(state) === REMINDER_UPCOMING;

        if (!isUpcoming) {
            this.store.dispatch(actions.showMore());
            this.setRenderTime();
            this.notifyUpdate();
            return;
        }

        const { page } = state.pagination;
        let { range } = state.pagination;
        if (!range) {
            range = 1;
        }
        range += 1;

        this.store.dispatch(requestUpcoming({
            ...getUpcomingRequestData(state),
            range,
            page,
            keepState: true,
            isLoadingMore: true,
        }));
    }

    /** Paginator 'change' event handler */
    onChangePage(page) {
        this.store.dispatch(actions.changePage(page));
        this.setRenderTime();
        this.notifyUpdate();
    }

    /** Toggle mode button 'click' event handler */
    onChangeMode(mode) {
        const state = this.store.getState();
        if (state.mode === mode) {
            return;
        }

        this.store.dispatch(actions.toggleMode());
        this.setRenderTime();
        this.notifyUpdate();
    }

    renderCounters(state, prevState) {
        if (
            state.items === prevState?.items
            && state.listMode === prevState?.listMode
        ) {
            return;
        }

        const itemsCount = state.items.length;
        const isSelectMode = (state.listMode === 'select');
        const selected = (isSelectMode) ? getSelectedItems(state.items) : [];

        this.itemsCounter.setContent(itemsCount.toString());
        this.selectedCounter.show(isSelectMode);
        this.selectedCounter.setContent(selected.length.toString());
    }

    renderModeSelector(state, prevState) {
        if (
            state.items === prevState?.items
            && state.mode === prevState?.mode
        ) {
            return;
        }

        if (this.useURL) {
            this.modeSelector.setURL(this.getURL(state));
        }
        this.modeSelector.setSelection(state.mode);
        this.modeSelector.show(state.items.length > 0);
    }

    renderPaginator(state, prevState) {
        if (
            state.items === prevState?.items
            && state.filter === prevState?.filter
            && state.pagination === prevState?.pagination
        ) {
            return;
        }

        const isUpcoming = state.filter?.reminderState === REMINDER_UPCOMING;
        const showPaginator = !isUpcoming && state.items.length > 0;

        if (showPaginator) {
            this.paginator.setState((paginatorState) => ({
                ...paginatorState,
                url: this.getURL(state),
                pagesCount: state.pagination.pagesCount,
                pageNum: this.getPageNum(state),
            }));
        }
        this.paginator.show(showPaginator);
    }

    renderShowMoreButton(state, prevState) {
        if (
            state.items === prevState?.items
            && state.pagination === prevState?.pagination
            && state.loading === prevState?.loading
            && state.isLoadingMore === prevState?.isLoadingMore
        ) {
            return;
        }

        const loadingMore = state.loading && state.isLoadingMore;
        const pageNum = this.getPageNum(state);

        this.showMoreBtn.show(
            state.items.length > 0
            && (!state.pagination.pagesCount || pageNum < state.pagination.pagesCount)
            && !loadingMore,
        );
        this.spinner.show(loadingMore);
    }

    renderFilters(state) {
        this.filters.setState((filtersState) => ({
            ...filtersState,
            ...state,
        }));
    }

    renderList(state, prevState) {
        if (
            state.items === prevState?.items
            && state.filter === prevState?.filter
            && state.mode === prevState?.mode
            && state.listMode === prevState?.listMode
            && state.pagination === prevState?.pagination
            && state.loading === prevState?.loading
            && state.isLoadingMore === prevState?.isLoadingMore
            && state.renderTime === prevState?.renderTime
        ) {
            return;
        }

        const firstItem = this.getAbsoluteIndex(0, state);
        const lastItem = firstItem + state.pagination.onPage * state.pagination.range;
        const items = state.items.slice(firstItem, lastItem);

        this.reminderList.setState((listState) => ({
            ...listState,
            items,
            mode: state.mode,
            listMode: state.listMode,
            renderTime: state.renderTime,
            showControls: state.showControls,
        }));
        this.reminderList.elem.classList.toggle(DETAILS_CLASS, state.mode === 'details');
    }

    setState(state) {
        this.store.setState(state);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.loading && !state.isLoadingMore) {
            this.loadingIndicator.show();
        }

        this.renderCounters(state, prevState);
        this.renderModeSelector(state, prevState);
        this.renderPaginator(state, prevState);
        this.renderShowMoreButton(state, prevState);
        this.renderList(state, prevState);
        this.renderFilters(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}
