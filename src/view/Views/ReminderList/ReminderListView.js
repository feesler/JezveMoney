import 'jezvejs/style';
import {
    asArray,
    isFunction,
    show,
} from 'jezvejs';

import { Button } from 'jezvejs/Button';
import { LinkMenu } from 'jezvejs/LinkMenu';
import { MenuButton } from 'jezvejs/MenuButton';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { Paginator } from 'jezvejs/Paginator';
import { Spinner } from 'jezvejs/Spinner';
import { ListContainer } from 'jezvejs/ListContainer';
import { createStore } from 'jezvejs/Store';

import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/AppView/AppView.js';
import {
    listData,
    __,
    getSelectedIds,
    getApplicationURL,
} from '../../utils/utils.js';
import { API } from '../../API/index.js';

import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { Schedule } from '../../Models/Schedule.js';
import {
    REMINDER_CANCELLED,
    REMINDER_CONFIRMED,
    REMINDER_SCHEDULED,
    REMINDER_UPCOMING,
    Reminder,
} from '../../Models/Reminder.js';
import { ReminderList } from '../../Models/ReminderList.js';

import { Heading } from '../../Components/Heading/Heading.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { FiltersContainer } from '../../Components/FiltersContainer/FiltersContainer.js';
import { ToggleDetailsButton } from '../../Components/ToggleDetailsButton/ToggleDetailsButton.js';
import { NoDataMessage } from '../../Components/NoDataMessage/NoDataMessage.js';

import { ReminderListItem } from './components/ReminderListItem/ReminderListItem.js';
import { ReminderDetails } from './components/ReminderDetails/ReminderDetails.js';
import { ReminderListContextMenu } from './components/ContextMenu/ReminderListContextMenu.js';
import { ReminderListMainMenu } from './components/MainMenu/ReminderListMainMenu.js';

import {
    actions,
    getStateFilter,
    reducer,
    updateList,
} from './reducer.js';
import './ReminderListView.scss';

/* CSS classes */
const LIST_CLASS = 'reminder-list';
const SELECT_MODE_CLASS = 'reminder-list_select';

/**
 * Scheduled transaction reminders list view
 */
class ReminderListView extends AppView {
    constructor(...args) {
        super(...args);

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            confirmBtn: () => this.confirmReminder(),
            cancelBtn: () => this.cancelReminder(),
        };

        this.contextMenuActions = {
            ctxDetailsBtn: () => this.showDetails(),
            ctxConfirmBtn: () => this.confirmReminder(),
            ctxCancelBtn: () => this.cancelReminder(),
        };

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(AccountList, 'accounts', App.props.accounts);
        App.loadModel(PersonList, 'persons', App.props.persons);
        App.loadModel(CategoryList, 'categories', App.props.categories);
        App.loadModel(Schedule, 'schedule', App.props.schedule);
        App.loadModel(ReminderList, 'reminders', App.props.reminders);

        const initialState = updateList({
            ...this.props,
            upcomingItems: null,
            loading: false,
            isLoadingMore: false,
            listMode: 'list',
            showMenu: false,
            showContextMenu: false,
            contextItem: null,
            renderTime: null,
        });

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'contentHeader',
            'filtersContainer',
            'stateFilter',
            'itemsCount',
            'selectedCounter',
            'selItemsCount',
            'heading',
            'contentContainer',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('reminders.listTitle'),
        });

        // Filters
        this.filtersBtn = Button.create({
            id: 'filtersBtn',
            className: 'circle-btn',
            icon: 'filter',
            onClick: () => this.filters.toggle(),
        });
        this.heading.actionsContainer.prepend(this.filtersBtn.elem);

        // State filter
        this.stateMenu = LinkMenu.create({
            id: 'stateMenu',
            itemParam: 'state',
            items: [
                { value: REMINDER_SCHEDULED, title: __('reminders.state.scheduled') },
                { value: REMINDER_UPCOMING, title: __('reminders.state.upcoming') },
                { value: REMINDER_CONFIRMED, title: __('reminders.state.submitted') },
                { value: REMINDER_CANCELLED, title: __('reminders.state.cancelled') },
            ],
            onChange: (value) => this.onSelectStateType(value),
        });
        this.stateFilter.append(this.stateMenu.elem);

        this.filters = FiltersContainer.create({
            content: this.filtersContainer,
        });
        this.contentHeader.prepend(this.filters.elem);

        // Scheduled transaction reminder details
        this.itemInfo = Offcanvas.create({
            placement: 'right',
            className: 'reminder-item-details',
            onClosed: () => this.closeDetails(),
        });

        this.reminderList = ListContainer.create({
            ItemComponent: ReminderListItem,
            getItemProps: (item, state) => ({
                item: Reminder.createExtended(item),
                selected: item.selected,
                listMode: state.listMode,
                mode: state.mode,
                showControls: (state.listMode === 'list'),
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
            placeholderClass: 'reminder-item_placeholder',
            listMode: 'list',
            PlaceholderComponent: NoDataMessage,
            getPlaceholderProps: () => ({ title: __('reminders.noData') }),
            onItemClick: (id, e) => this.onItemClick(id, e),
        });

        this.listModeBtn = Button.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('actions.done'),
            onClick: () => this.setListMode('list'),
        });

        this.menuButton = MenuButton.create({
            className: 'circle-btn',
            onClick: (e) => this.showMenu(e),
        });
        this.heading.actionsContainer.append(
            this.listModeBtn.elem,
            this.menuButton.elem,
        );

        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });

        this.contentContainer.append(
            this.reminderList.elem,
            this.loadingIndicator.elem,
        );

        // List mode selected
        const listHeader = document.querySelector('.list-header');
        this.modeSelector = ToggleDetailsButton.create({
            onClick: (e) => this.onToggleMode(e),
        });
        listHeader.append(this.modeSelector.elem);

        // 'Show more' button
        this.spinner = Spinner.create({ className: 'request-spinner' });
        this.spinner.hide();
        this.showMoreBtn = Button.create({
            className: 'show-more-btn',
            title: __('actions.showMore'),
            onClick: (e) => this.showMore(e),
        });

        // Paginator
        this.paginator = Paginator.create({
            arrows: true,
            breakLimit: 3,
            onChange: (page) => this.onChangePage(page),
        });

        const listFooter = document.querySelector('.list-footer');
        listFooter.append(this.showMoreBtn.elem, this.spinner.elem, this.paginator.elem);

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

    showMenu() {
        this.store.dispatch(actions.showMenu());
    }

    hideMenu() {
        this.store.dispatch(actions.hideMenu());
    }

    /**
     * Reminder state filter change callback
     * @param {string} value - selected state types
     */
    async onSelectStateType(value) {
        const stateFilter = parseInt(value, 10);
        const state = this.store.getState();
        const currentStateFilter = getStateFilter(state);
        if (currentStateFilter === stateFilter) {
            return;
        }

        if (stateFilter === REMINDER_UPCOMING && state.upcomingItems === null) {
            await this.requestUpcoming(this.getUpcomingRequestData());
        }

        this.store.dispatch(actions.changeStateFilter(value));
        this.setRenderTime();
    }

    onMenuClick(item) {
        this.menu.hideMenu();

        const menuAction = this.menuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
    }

    onContextMenuClick(item) {
        this.hideContextMenu();

        const menuAction = this.contextMenuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
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

    onToggleMode(e) {
        e.preventDefault();

        this.store.dispatch(actions.toggleMode());
        this.setRenderTime();
    }

    onItemClick(id, e) {
        const { listMode } = this.store.getState();
        if (listMode === 'list') {
            const menuBtn = e?.target?.closest('.menu-btn');
            if (menuBtn) {
                this.showContextMenu(id);
            }
        } else if (listMode === 'select') {
            if (e?.target?.closest('.checkbox') && e.pointerType !== '') {
                e.preventDefault();
            }

            this.toggleSelectItem(id);
        }
    }

    showDetails() {
        this.store.dispatch(actions.showDetails());
    }

    closeDetails() {
        this.store.dispatch(actions.closeDetails());
    }

    showContextMenu(itemId) {
        this.store.dispatch(actions.showContextMenu(itemId));
    }

    hideContextMenu() {
        this.store.dispatch(actions.hideContextMenu());
    }

    toggleSelectItem(itemId) {
        this.store.dispatch(actions.toggleSelectItem(itemId));
    }

    selectAll() {
        this.store.dispatch(actions.selectAllItems());
    }

    deselectAll() {
        this.store.dispatch(actions.deselectAllItems());
    }

    setListMode(listMode) {
        this.store.dispatch(actions.changeListMode(listMode));
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

    getContextIds(state) {
        if (state.listMode === 'list') {
            return asArray(state.contextItem);
        }

        return getSelectedIds(state.items);
    }

    async requestList(options = {}) {
        const { keepState = false } = options;

        this.startLoading();

        try {
            const request = this.getListRequest();
            const { data } = await API.reminder.list(request);
            this.setListData(data, keepState);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    getListRequest() {
        return {};
    }

    getUpcomingListRequest() {
        const state = this.store.getState();
        if (getStateFilter(state) !== REMINDER_UPCOMING) {
            return {};
        }

        return {
            page: state.pagination.page,
            range: state.pagination.range,
        };
    }

    prepareRequest(data) {
        return {
            ...data,
            returnState: {
                reminders: this.getListRequest(),
                upcoming: this.getUpcomingListRequest(),
                profile: {},
            },
        };
    }

    getRequestData(state) {
        const ids = this.getContextIds(state);
        if (getStateFilter(state) !== REMINDER_UPCOMING) {
            return { id: ids };
        }

        return {
            upcoming: ids.map((id) => {
                const strId = id?.toString();
                const reminder = state.items.find((item) => item?.id?.toString() === strId);
                return {
                    schedule_id: reminder.schedule_id,
                    date: reminder.date,
                };
            }),
        };
    }

    getListDataFromResponse(response) {
        return response?.data?.state?.reminders?.data;
    }

    getUpcomingDataFromResponse(response) {
        return response?.data?.state?.upcoming?.data;
    }

    setListData(data, keepState = false) {
        App.model.reminders.setData(data);
        this.store.dispatch(actions.listRequestLoaded({ keepState }));
    }

    setListDataFromResponse(response, keepState = false) {
        const reminders = this.getListDataFromResponse(response);
        const upcoming = this.getUpcomingDataFromResponse(response);

        App.model.reminders.setData(reminders);

        this.store.dispatch(actions.listRequestLoaded({ upcoming, keepState }));
    }

    async requestItem() {
        const state = this.store.getState();
        if (!state.detailsId) {
            return;
        }

        try {
            const { data } = await API.reminder.read(state.detailsId);
            const [item] = data;

            this.store.dispatch(actions.itemDetailsLoaded(item));
        } catch (e) {
            App.createErrorNotification(e.message);
        }
    }

    getUpcomingRequestData() {
        const { pagination } = this.store.getState();

        const res = {
            page: pagination.page,
            range: pagination.range,
        };

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

        this.startLoading();

        try {
            const { data: upcoming } = await API.reminder.upcoming(request);
            this.store.dispatch(actions.listRequestLoaded({ upcoming, keepState }));

            if (isLoadingMore) {
                this.store.dispatch(actions.showMore());
            }
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    /** Creates transactions for selected reminders */
    async confirmReminder() {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const ids = this.getContextIds(state);
        if (ids.length === 0) {
            return;
        }

        this.startLoading();

        try {
            const request = this.prepareRequest(this.getRequestData(state));
            const response = await API.reminder.confirm(request);

            this.setListDataFromResponse(response);
            App.updateProfileFromResponse(response);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setRenderTime();
    }

    /** Cancels selected reminders */
    async cancelReminder() {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const ids = this.getContextIds(state);
        if (ids.length === 0) {
            return;
        }

        this.startLoading();

        try {
            const request = this.prepareRequest(this.getRequestData(state));
            const response = await API.reminder.cancel(request);

            this.setListDataFromResponse(response);
            App.updateProfileFromResponse(response);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setRenderTime();
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = ReminderListContextMenu.create({
                id: 'contextMenu',
                onItemClick: (item) => this.onContextMenuClick(item),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.contextMenu.setState({
            showContextMenu: state.showContextMenu,
            contextItem: state.contextItem,
            items: state.items,
        });
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
        const isListMode = state.listMode === 'list';

        this.listModeBtn.show(!isListMode);
        this.menuButton.show(itemsCount > 0);

        if (!state.showMenu && !this.menu) {
            return;
        }

        const showFirstTime = !this.menu;
        if (!this.menu) {
            this.menu = ReminderListMainMenu.create({
                id: 'listMenu',
                attachTo: this.menuButton.elem,
                onItemClick: (item) => this.onMenuClick(item),
                onClose: () => this.hideMenu(),
            });
        }

        this.menu.setState({
            listMode: state.listMode,
            showMenu: state.showMenu,
            items: state.items,
            filter: state.filter,
        });

        if (showFirstTime) {
            this.menu.showMenu();
        }
    }

    renderDetails(state, prevState) {
        if (
            state.detailsId === prevState?.detailsId
            && state.detailsItem === prevState?.detailsItem
        ) {
            return;
        }

        if (!state.detailsId) {
            this.itemInfo.close();
            return;
        }

        const { reminders } = App.model;
        const item = state.detailsItem ?? reminders.getItem(state.detailsId);
        if (!item) {
            throw new Error('Reminder not found');
        }

        if (!this.reminderDetails) {
            this.reminderDetails = ReminderDetails.create({
                item,
                onClose: () => this.closeDetails(),
            });
            this.itemInfo.setContent(this.reminderDetails.elem);
        } else {
            this.reminderDetails.setItem(item);
        }

        this.itemInfo.open();
    }

    /** Returns URL for specified state */
    getURL(state, keepPage = true) {
        const { filter } = state;
        const itemPart = (state.detailsId) ? state.detailsId : '';
        const params = {};

        if (filter.state !== REMINDER_SCHEDULED) {
            params.state = Reminder.getStateName(filter.state);
        }

        if (keepPage) {
            params.page = state.pagination.page;
        }

        if (state.mode === 'details') {
            params.mode = 'details';
        }

        return getApplicationURL(`reminders/${itemPart}`, params);
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

    renderHistory(state, prevState) {
        if (
            state.detailsId === prevState?.detailsId
            && state.mode === prevState?.mode
            && state.pagination?.page === prevState?.pagination?.page
            && state.filter === prevState?.filter
        ) {
            return;
        }

        const url = this.getURL(state);
        const pageTitle = `${__('appName')} | ${__('reminders.listTitle')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    renderFilters(state, prevState) {
        if (
            state.filter === prevState?.filter
        ) {
            return;
        }

        const filterUrl = this.getURL(state, false);

        this.stateMenu.setURL(filterUrl);
        this.stateMenu.setSelection(state.filter.state);
    }

    renderList(state, prevState) {
        if (
            state.items === prevState?.items
            && state.filter === prevState?.filter
            && state.mode === prevState?.mode
            && state.listMode === prevState?.listMode
            && state.pagination.page === prevState?.pagination?.page
            && state.pagination.range === prevState?.pagination?.range
            && state.pagination.pagesCount === prevState?.pagination?.pagesCount
            && state.pagination.onPage === prevState?.pagination?.onPage
            && state.loading === prevState?.loading
            && state.isLoadingMore === prevState?.isLoadingMore
            && state.renderTime === prevState?.renderTime
        ) {
            return;
        }

        // Counters
        const itemsCount = state.items.length;
        this.itemsCount.textContent = itemsCount;
        const isSelectMode = (state.listMode === 'select');
        show(this.selectedCounter, isSelectMode);
        const selected = (isSelectMode) ? getSelectedIds(state.items) : [];
        this.selItemsCount.textContent = selected.length;

        // Paginator
        const isUpcoming = getStateFilter(state) === REMINDER_UPCOMING;
        const showPaginator = !isUpcoming && state.items.length > 0;
        const range = state.pagination.range ?? 1;
        const pageNum = state.pagination.page + range - 1;
        if (showPaginator) {
            this.paginator.setState((paginatorState) => ({
                ...paginatorState,
                url: this.getURL(state),
                pagesCount: state.pagination.pagesCount,
                pageNum,
            }));
        }
        this.paginator.show(showPaginator);

        // 'Show more' button
        const loadingMore = state.loading && state.isLoadingMore;
        this.showMoreBtn.show(
            state.items.length > 0
            && (isUpcoming || pageNum < state.pagination.pagesCount)
            && !loadingMore,
        );
        this.spinner.show(loadingMore);

        const firstItem = this.getAbsoluteIndex(0, state);
        const lastItem = firstItem + state.pagination.onPage * state.pagination.range;
        const items = listData(state.items).slice(firstItem, lastItem);

        // List of reminders
        this.reminderList.setState((listState) => ({
            ...listState,
            items,
            mode: state.mode,
            listMode: state.listMode,
            renderTime: state.renderTime,
        }));
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderHistory(state, prevState);

        if (state.loading && !state.isLoadingMore) {
            this.loadingIndicator.show();
        }

        const isDetails = (state.mode === 'details');

        const modeURL = this.getURL(state);
        modeURL.searchParams.set('mode', (isDetails) ? 'classic' : 'details');

        this.modeSelector.show(state.items.length > 0);
        this.modeSelector.setState((modeSelectorState) => ({
            ...modeSelectorState,
            details: isDetails,
            url: modeURL.toString(),
        }));

        this.renderFilters(state, prevState);
        this.renderList(state, prevState);
        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDetails(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(ReminderListView);
