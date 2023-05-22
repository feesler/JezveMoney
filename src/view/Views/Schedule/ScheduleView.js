import 'jezvejs/style';
import {
    asArray,
    insertAfter,
    isFunction,
    show,
} from 'jezvejs';

import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { ListContainer } from 'jezvejs/ListContainer';
import { createStore } from 'jezvejs/Store';

import { Application } from '../../Application/Application.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';
import { listData, __ } from '../../utils/utils.js';
import { API } from '../../API/index.js';

import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { Schedule } from '../../Models/Schedule.js';
import { ScheduledTransaction } from '../../Models/ScheduledTransaction.js';

import { Heading } from '../../Components/Heading/Heading.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';

import { ScheduleListItem } from './components/ScheduleListItem/ScheduleListItem.js';
import { ScheduleItemDetails } from './components/ScheduleItemDetails/ScheduleItemDetails.js';

import { actions, createList, reducer } from './reducer.js';
import './ScheduleView.scss';

/* CSS classes */
const LIST_CLASS = 'schedule-list';
const SELECT_MODE_CLASS = 'schedule-list_select';

/**
 * List of scheduled transactions view
 */
class ScheduleView extends View {
    constructor(...args) {
        super(...args);

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);
        window.app.loadModel(Schedule, 'schedule', window.app.props.schedule);

        const initialState = {
            ...this.props,
            items: createList(window.app.model.schedule),
            loading: false,
            listMode: 'list',
            showMenu: false,
            showContextMenu: false,
            contextItem: null,
            renderTime: Date.now(),
        };

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'contentHeader',
            'itemsCount',
            'selectedCounter',
            'selItemsCount',
            'heading',
            'contentContainer',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('SCHEDULE'),
        });

        // Scheduled transaction details
        this.itemInfo = Offcanvas.create({
            placement: 'right',
            className: 'schedule-item-details',
            onClosed: () => this.closeDetails(),
        });

        this.createBtn = Button.create({
            id: 'createBtn',
            type: 'link',
            className: 'circle-btn',
            icon: 'plus',
            url: `${window.app.baseURL}schedule/create/`,
        });
        this.heading.actionsContainer.prepend(this.createBtn.elem);

        this.scheduleList = ListContainer.create({
            ItemComponent: ScheduleListItem,
            getItemProps: (item, { listMode }) => ({
                item: ScheduledTransaction.create(item),
                selected: item.selected,
                listMode,
                mode: 'classic',
                showControls: (listMode === 'list'),
            }),
            getItemById: (id) => this.getItemById(id),
            className: LIST_CLASS,
            itemSelector: ScheduleListItem.selector,
            selectModeClass: SELECT_MODE_CLASS,
            placeholderClass: 'schedule-item_placeholder',
            listMode: 'list',
            noItemsMessage: __('SCHEDULE_NO_DATA'),
            onItemClick: (id, e) => this.onItemClick(id, e),
        });

        this.listModeBtn = Button.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('DONE'),
            onClick: () => this.setListMode('list'),
        });
        insertAfter(this.listModeBtn.elem, this.createBtn.elem);

        this.menuButton = MenuButton.create({
            className: 'circle-btn',
            onClick: (e) => this.showMenu(e),
        });
        insertAfter(this.menuButton.elem, this.listModeBtn.elem);

        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });

        this.contentContainer.append(
            this.scheduleList.elem,
            this.loadingIndicator.elem,
        );

        this.subscribeToStore(this.store);
    }

    createMenu() {
        if (this.menu) {
            return;
        }

        this.menu = PopupMenu.create({
            id: 'listMenu',
            attachTo: this.menuButton.elem,
            onClose: () => this.hideMenu(),
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: __('SELECT'),
                onClick: () => this.onMenuClick('selectModeBtn'),
            }, {
                id: 'selectAllBtn',
                title: __('SELECT_ALL'),
                onClick: () => this.onMenuClick('selectAllBtn'),
            }, {
                id: 'deselectAllBtn',
                title: __('DESELECT_ALL'),
                onClick: () => this.onMenuClick('deselectAllBtn'),
            }, {
                id: 'separator2',
                type: 'separator',
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('DELETE'),
                onClick: () => this.onMenuClick('deleteBtn'),
            }],
        });

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            deleteBtn: () => this.confirmDelete(),
        };
    }

    createContextMenu() {
        if (this.contextMenu) {
            return;
        }

        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            fixed: false,
            onItemClick: () => this.hideContextMenu(),
            onClose: () => this.hideContextMenu(),
            items: [{
                id: 'ctxDetailsBtn',
                type: 'link',
                title: __('OPEN_ITEM'),
                onClick: (e) => this.showDetails(e),
            }, {
                type: 'placeholder',
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('UPDATE'),
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('DELETE'),
                onClick: () => this.confirmDelete(),
            }],
        });
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
        if (!isFunction(menuAction)) {
            return;
        }

        menuAction();
    }

    getItemById(itemId) {
        return window.app.model.schedule.getItem(itemId);
    }

    onItemClick(itemId, e) {
        const id = parseInt(itemId, 10);
        if (!id) {
            return;
        }

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

    showDetails(e) {
        e?.preventDefault();
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

    async setListMode(listMode) {
        this.store.dispatch(actions.changeListMode(listMode));
    }

    startLoading() {
        this.store.dispatch(actions.startLoading());
    }

    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    getSelectedItems(state) {
        return state.items.filter((item) => item.selected);
    }

    getSelectedIds(state) {
        const selArr = this.getSelectedItems(state);
        return selArr.map((item) => item.id);
    }

    getContextIds(state) {
        if (state.listMode === 'list') {
            return asArray(state.contextItem);
        }

        return this.getSelectedIds(state);
    }

    async deleteItems() {
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
            const request = this.prepareRequest({ id: ids });
            const response = await API.schedule.del(request);
            const data = this.getListDataFromResponse(response);
            this.setListData(data);
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    async requestList(options = {}) {
        const { keepState = false } = options;

        this.startLoading();

        try {
            const request = this.getListRequest();
            const { data } = await API.schedule.list(request);
            this.setListData(data, keepState);
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    getListRequest() {
        return {};
    }

    prepareRequest(data) {
        return {
            ...data,
            returnState: {
                schedule: this.getListRequest(),
            },
        };
    }

    getListDataFromResponse(response) {
        return response?.data?.state?.schedule?.data;
    }

    setListData(data, keepState = false) {
        window.app.model.schedule.setData(data);
        this.store.dispatch(actions.listRequestLoaded(keepState));
    }

    async requestItem() {
        const state = this.store.getState();
        if (!state.detailsId) {
            return;
        }

        try {
            const { data } = await API.schedule.read(state.detailsId);
            const [item] = data;

            this.store.dispatch(actions.itemDetailsLoaded(item));
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }
    }

    /** Show person(s) delete confirmation popup */
    confirmDelete() {
        const state = this.store.getState();
        const ids = this.getContextIds(state);
        if (ids.length === 0) {
            return;
        }

        const multiple = (ids.length > 1);
        const title = (multiple)
            ? __('SCHED_TRANS_DELETE_MULTIPLE')
            : __('SCHED_TRANS_DELETE');
        const content = (multiple)
            ? __('MSG_CATEGORY_DELETE_MULTIPLE')
            : __('MSG_SCHED_TRANS_DELETE');

        ConfirmDialog.create({
            id: 'delete_warning',
            title,
            content,
            onConfirm: () => this.deleteItems(),
        });
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list' || !state.showContextMenu) {
            this.contextMenu?.detach();
            return;
        }

        const itemId = state.contextItem;
        const scheduleItem = window.app.model.schedule.getItem(itemId);
        if (!scheduleItem) {
            this.contextMenu?.detach();
            return;
        }

        const selector = `.schedule-item[data-id="${itemId}"] .menu-btn`;
        const menuButton = this.contentContainer.querySelector(selector);
        if (!menuButton) {
            this.contextMenu?.detach();
            return;
        }

        if (!this.contextMenu) {
            this.createContextMenu();
        }

        const { baseURL } = window.app;
        const { items } = this.contextMenu;
        items.ctxDetailsBtn.setURL(`${baseURL}schedule/${itemId}`);
        items.ctxUpdateBtn.setURL(`${baseURL}schedule/update/${itemId}`);

        this.contextMenu.attachAndShow(menuButton);
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
        const selArr = this.getSelectedItems(state);
        const selCount = selArr.length;
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';

        this.createBtn.show(isListMode);
        this.listModeBtn.show(!isListMode);

        this.menuButton.show(itemsCount > 0);

        if (!state.showMenu) {
            this.menu?.hideMenu();
            return;
        }

        const showFirstTime = !this.menu;
        this.createMenu();

        const { items } = this.menu;

        items.selectModeBtn.show(isListMode && itemsCount > 0);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && selCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && selCount > 0);
        show(items.separator2, isSelectMode);

        items.deleteBtn.show(selCount > 0);

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

        const { schedule } = window.app.model;
        const item = state.detailsItem ?? schedule.getItem(state.detailsId);
        if (!item) {
            throw new Error('Scheduled transaction not found');
        }

        if (!this.scheduleItemDetails) {
            this.scheduleItemDetails = ScheduleItemDetails.create({
                item,
                onClose: () => this.closeDetails(),
            });
            this.itemInfo.setContent(this.scheduleItemDetails.elem);
        } else {
            this.scheduleItemDetails.setItem(item);
        }

        this.itemInfo.open();
    }

    /** Returns URL for specified state */
    getURL(state) {
        const { baseURL } = window.app;
        const itemPart = (state.detailsId) ? state.detailsId : '';
        return new URL(`${baseURL}schedule/${itemPart}`);
    }

    renderHistory(state, prevState) {
        if (state.detailsId === prevState?.detailsId) {
            return;
        }

        const url = this.getURL(state);
        const pageTitle = `${__('APP_NAME')} | ${__('SCHEDULE')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    renderList(state, prevState) {
        if (
            state.items === prevState?.items
            && state.listMode === prevState?.listMode
        ) {
            return;
        }

        // Counters
        const itemsCount = state.items.length;
        this.itemsCount.textContent = itemsCount;
        const isSelectMode = (state.listMode === 'select');
        show(this.selectedCounter, isSelectMode);
        const selected = (isSelectMode) ? this.getSelectedIds(state) : [];
        this.selItemsCount.textContent = selected.length;

        // List of scheduled transactions
        this.scheduleList.setState((listState) => ({
            ...listState,
            items: listData(state.items),
            listMode: state.listMode,
            renderTime: Date.now(),
        }));
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderHistory(state, prevState);

        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.renderList(state, prevState);
        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDetails(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(ScheduleView);
