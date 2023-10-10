import {
    Component,
    createElement,
    isFunction,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { ListContainer } from 'jezvejs/ListContainer';
import { Paginator } from 'jezvejs/Paginator';
import { Spinner } from 'jezvejs/Spinner';

import { __, getSelectedItems, listData } from '../../../utils/utils.js';

import { REMINDER_SCHEDULED, REMINDER_UPCOMING, Reminder } from '../../../Models/Reminder.js';

import { LoadingIndicator } from '../../Common/LoadingIndicator/LoadingIndicator.js';
import { NoDataMessage } from '../../Common/NoDataMessage/NoDataMessage.js';
import { ListCounter } from '../../List/ListCounter/ListCounter.js';
import { ToggleDetailsButton } from '../../List/ToggleDetailsButton/ToggleDetailsButton.js';
import { FiltersContainer } from '../../List/FiltersContainer/FiltersContainer.js';
import { ReminderFilters } from '../ReminderFilters/ReminderFilters.js';
import { ReminderListItem } from '../ReminderListItem/ReminderListItem.js';

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
    listMode: 'list',
    showControls: true,
    onItemClick: null,
    getURL: null,
    onShowMore: null,
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

        this.state = {
            ...this.props,
        };

        this.init();
    }

    get useURL() {
        return isFunction(this.props.getURL);
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

        this.setClassNames();
        this.setUserProps();
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
        this.filtersContainer.close();

        if (isFunction(this.props.onApplyFilters)) {
            this.props.onApplyFilters(e);
        }
    }

    onClearAllFilters(e) {
        if (isFunction(this.props.onClearAllFilters)) {
            this.props.onClearAllFilters(e);
        }
    }

    onItemClick(id, e) {
        if (isFunction(this.props.onItemClick)) {
            this.props.onItemClick(id, e);
        }
    }

    /** 'Show more' button 'click' event handler */
    onShowMore(e) {
        if (isFunction(this.props.onShowMore)) {
            this.props.onShowMore(e);
        }
    }

    /** Paginator 'change' event handler */
    onChangePage(page) {
        if (isFunction(this.props.onChangePage)) {
            this.props.onChangePage(page);
        }
    }

    /** Toggle mode button 'click' event handler */
    onChangeMode(value) {
        if (isFunction(this.props.onChangeMode)) {
            this.props.onChangeMode(value);
        }
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
        const items = listData(state.items).slice(firstItem, lastItem);

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
