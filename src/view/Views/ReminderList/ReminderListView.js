import 'jezvejs/style';
import { isFunction } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { createStore } from 'jezvejs/Store';

import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/AppView/AppView.js';
import {
    __,
    getApplicationURL,
    dateStringToTime,
    formatDateRange,
    getContextIds,
} from '../../utils/utils.js';
import { API } from '../../API/index.js';

import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { Schedule } from '../../Models/Schedule.js';
import {
    REMINDER_SCHEDULED,
    REMINDER_UPCOMING,
    Reminder,
} from '../../Models/Reminder.js';
import { ReminderList } from '../../Models/ReminderList.js';

import { Heading } from '../../Components/Heading/Heading.js';
import { FiltersContainer } from '../../Components/FiltersContainer/FiltersContainer.js';
import { ReminderFilters } from '../../Components/ReminderFilters/ReminderFilters.js';
import { ReminderListGroup } from '../../Components/ReminderListGroup/ReminderListGroup.js';

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

        const filter = this.props.filter ?? {};

        const initialState = updateList({
            ...this.props,
            form: {
                ...filter,
                ...formatDateRange(filter),
            },
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
            onClick: () => this.filtersContainer.toggle(),
        });
        this.heading.actionsContainer.prepend(this.filtersBtn.elem);

        this.filters = ReminderFilters.create({
            id: 'filters',
            stateFilterId: 'stateFilter',
            dateRangeFilterId: 'dateFilter',
            getURL: (state, keepPage) => this.getURL(state, keepPage),
            onChangeReminderState: (range) => this.onChangeReminderState(range),
            onChangeDateRange: (range) => this.changeDateFilter(range),
            onApplyFilters: (e) => this.onApplyFilters(e),
            onClearAllFilters: (e) => this.onClearAllFilters(e),
        });

        this.filtersContainer = FiltersContainer.create({
            content: this.filters.elem,
        });
        this.contentHeader.prepend(this.filtersContainer.elem);

        // Scheduled transaction reminder details
        this.itemInfo = Offcanvas.create({
            placement: 'right',
            className: 'reminder-item-details',
            onClosed: () => this.closeDetails(),
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

        this.listGroup = ReminderListGroup.create({
            getURL: (...args) => this.getURL(...args),
            onItemClick: (id, e) => this.onItemClick(id, e),
            onShowMore: (e) => this.showMore(e),
            onChangePage: (page) => this.onChangePage(page),
            onChangeMode: (mode) => this.onChangeMode(mode),
        });
        this.contentContainer.append(this.listGroup.elem);

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

    /** Date range filter change handler */
    async changeDateFilter(data) {
        const { filter } = this.store.getState();
        const startDate = filter.startDate ?? null;
        const endDate = filter.endDate ?? null;
        const timeData = {
            startDate: dateStringToTime(data.startDate, { fixShortYear: false }),
            endDate: dateStringToTime(data.endDate, { fixShortYear: false }),
        };

        if (startDate === timeData.startDate && endDate === timeData.endDate) {
            return;
        }

        this.store.dispatch(actions.changeDateFilter(data));
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
     * Applies filters and close Offcanvas
     */
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

    onChangeMode(mode) {
        const state = this.store.getState();
        if (state.mode === mode) {
            return;
        }

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
        this.setRenderTime();
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
        const state = this.store.getState();
        if (getStateFilter(state) === REMINDER_UPCOMING) {
            return {};
        }

        return {
            page: state.pagination.page,
            range: state.pagination.range,
        };
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
        const ids = getContextIds(state);
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

    /** Creates transactions for selected reminders */
    async confirmReminder() {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const ids = getContextIds(state);
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

        const ids = getContextIds(state);
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

        this.contextMenu.setContext({
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

        this.menu.setContext({
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

        if (filter.reminderState !== REMINDER_SCHEDULED) {
            params.reminderState = Reminder.getStateName(filter.reminderState);
        }

        if (filter.startDate) {
            params.startDate = filter.startDate;
        }
        if (filter.endDate) {
            params.endDate = filter.endDate;
        }

        if (keepPage) {
            params.page = state.pagination.page;
        }

        if (state.mode === 'details') {
            params.mode = 'details';
        }

        return getApplicationURL(`reminders/${itemPart}`, params);
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

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderHistory(state, prevState);
        this.renderFilters(state, prevState);
        this.renderList(state, prevState);
        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDetails(state, prevState);
    }
}

App.createView(ReminderListView);
