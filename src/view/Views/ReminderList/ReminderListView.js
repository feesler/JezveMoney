import 'jezvejs/style';
import { isFunction } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { createStore } from 'jezvejs/Store';

// Application
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/Layout/AppView/AppView.js';
import {
    __,
    getApplicationURL,
    formatDateRange,
} from '../../utils/utils.js';
import { API } from '../../API/index.js';

// Models
import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { Schedule } from '../../Models/Schedule.js';
import {
    REMINDER_SCHEDULED,
    Reminder,
} from '../../Models/Reminder.js';
import { ReminderList } from '../../Models/ReminderList.js';

// Common components
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { ReminderListGroup } from '../../Components/Reminder/ReminderListGroup/ReminderListGroup.js';

// Local components
import { ReminderDetails } from './components/ReminderDetails/ReminderDetails.js';
import { ReminderListContextMenu } from './components/ContextMenu/ReminderListContextMenu.js';
import { ReminderListMainMenu } from './components/MainMenu/ReminderListMainMenu.js';

import { actions, reducer } from './reducer.js';
import './ReminderListView.scss';

/**
 * Scheduled transaction reminders list view
 */
class ReminderListView extends AppView {
    constructor(...args) {
        super(...args);

        this.menuActions = {
            selectModeBtn: () => this.listGroup?.setListMode('select'),
            selectAllBtn: () => this.listGroup?.selectAll(),
            deselectAllBtn: () => this.listGroup?.deselectAll(),
            confirmBtn: () => this.listGroup?.confirmReminder(),
            cancelBtn: () => this.listGroup?.cancelReminder(),
        };

        this.contextMenuActions = {
            ctxDetailsBtn: () => this.showDetails(),
            ctxConfirmBtn: () => this.listGroup?.confirmReminder(),
            ctxCancelBtn: () => this.listGroup?.cancelReminder(),
        };

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(AccountList, 'accounts', App.props.accounts);
        App.loadModel(PersonList, 'persons', App.props.persons);
        App.loadModel(CategoryList, 'categories', App.props.categories);
        App.loadModel(Schedule, 'schedule', App.props.schedule);
        App.loadModel(ReminderList, 'reminders', App.props.reminders);

        const filter = this.props.filter ?? {};

        const initialState = {
            ...this.props,
            form: {
                ...filter,
                ...formatDateRange(filter),
            },
            items: [],
            listMode: 'list',
            showMenu: false,
            showContextMenu: false,
            contextItem: null,
        };

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'heading',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('reminders.listTitle'),
        });

        // Filters
        this.filtersBtn = Button.create({
            id: 'filtersBtn',
            className: 'circle-btn',
            icon: 'filter',
            onClick: () => this.listGroup?.toggleFilters(),
        });
        this.heading.actionsContainer.prepend(this.filtersBtn.elem);

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
            onClick: () => this.listGroup?.setListMode('list'),
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
            ...this.props,
            stateFilterId: 'stateFilter',
            dateRangeFilterId: 'dateFilter',
            getURL: (...args) => this.getURL(...args),
            onUpdate: (state) => this.updateRemindersList(state),
            showContextMenu: (itemId) => this.showContextMenu(itemId),
        });
        this.heading.elem.after(this.listGroup.elem);

        this.subscribeToStore(this.store);
    }

    showMenu() {
        this.store.dispatch(actions.showMenu());
    }

    hideMenu() {
        this.store.dispatch(actions.hideMenu());
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

    updateRemindersList(data) {
        this.store.dispatch(actions.updateRemindersList(data));
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
        this.renderList(state, prevState);
        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDetails(state, prevState);
    }
}

App.createView(ReminderListView);
