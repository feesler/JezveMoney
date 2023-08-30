import 'jezvejs/style';
import {
    asArray,
    insertAfter,
    isFunction,
    show,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { SortableListContainer } from 'jezvejs/SortableListContainer';
import { createStore } from 'jezvejs/Store';

import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/AppView/AppView.js';
import {
    listData,
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
    __,
    getApplicationURL,
} from '../../utils/utils.js';
import { API } from '../../API/index.js';

import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { IconList } from '../../Models/IconList.js';

import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { NoDataMessage } from '../../Components/NoDataMessage/NoDataMessage.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { AccountDetails } from './components/AccountDetails/AccountDetails.js';
import { AccountListContextMenu } from './components/ContextMenu/AccountListContextMenu.js';
import { AccountListMainMenu } from './components/MainMenu/AccountListMainMenu.js';

import { actions, createList, reducer } from './reducer.js';
import { getAccountsSortMode, getSelectedIds } from './helpers.js';
import './AccountListView.scss';

/**
 * List of accounts view
 */
class AccountListView extends AppView {
    constructor(...args) {
        super(...args);

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            sortModeBtn: () => this.setListMode('sort'),
            sortByNameBtn: () => this.toggleSortByName(),
            sortByDateBtn: () => this.toggleSortByDate(),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            showBtn: () => this.showItems(true),
            hideBtn: () => this.showItems(false),
            deleteBtn: () => this.confirmDelete(),
        };

        this.contextMenuActions = {
            ctxDetailsBtn: () => this.showDetails(),
            ctxShowBtn: () => this.showItems(),
            ctxHideBtn: () => this.showItems(false),
            ctxDeleteBtn: () => this.confirmDelete(),
        };

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(AccountList, 'accounts', App.props.accounts);
        App.checkUserAccountModels();
        App.loadModel(IconList, 'icons', App.props.icons);

        const { visibleUserAccounts, hiddenUserAccounts } = App.model;
        const { settings } = App.model.profile;
        const sortMode = settings.sort_accounts;

        const initialState = {
            ...this.props,
            detailsItem: null,
            items: {
                visible: createList(visibleUserAccounts, sortMode),
                hidden: createList(hiddenUserAccounts, sortMode),
            },
            loading: false,
            listMode: 'list',
            showMenu: false,
            sortMode,
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
        const listProps = {
            ItemComponent: AccountTile,
            getItemProps: (account, { listMode }) => ({
                type: 'button',
                account,
                selected: account.selected ?? false,
                listMode,
            }),
            className: 'tiles',
            itemSelector: AccountTile.selector,
            itemSortSelector: AccountTile.sortSelector,
            selectModeClass: 'tiles_select',
            sortModeClass: 'tiles_sort',
            placeholderClass: 'tile_placeholder',
            listMode: 'list',
            PlaceholderComponent: NoDataMessage,
            getPlaceholderProps: () => ({ title: __('accounts.noData') }),
            onItemClick: (id, e) => this.onItemClick(id, e),
            onSort: (info) => this.onSort(info),
        };

        this.loadElementsByIds([
            'contentHeader',
            'itemsCount',
            'hiddenCount',
            'selectedCounter',
            'selItemsCount',
            'heading',
            'contentContainer',
            'hiddenTilesHeading',
            'itemInfo',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('accounts.listTitle'),
        });

        this.createBtn = Button.create({
            id: 'createBtn',
            type: 'link',
            className: 'circle-btn',
            icon: 'plus',
            url: `${App.baseURL}accounts/create/`,
        });
        this.heading.actionsContainer.prepend(this.createBtn.elem);

        this.visibleTiles = SortableListContainer.create({
            ...listProps,
            sortGroup: 'visibleAccounts',
        });
        this.contentContainer.prepend(this.visibleTiles.elem);

        this.hiddenTiles = SortableListContainer.create({
            ...listProps,
            sortGroup: 'hiddenAccounts',
        });
        this.contentContainer.append(this.hiddenTiles.elem);

        this.listModeBtn = Button.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('actions.done'),
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
        this.contentContainer.append(this.loadingIndicator.elem);

        this.subscribeToStore(this.store);

        if (this.props.detailsId) {
            this.requestItem();
        }
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

    onItemClick(itemId, e) {
        const id = parseInt(itemId, 10);
        if (!id) {
            return;
        }

        const { listMode } = this.store.getState();
        if (listMode === 'list') {
            this.showContextMenu(id);
        } else if (listMode === 'select') {
            if (e?.target?.closest('.checkbox') && e.pointerType !== '') {
                e.preventDefault();
            }

            this.toggleSelectItem(id);
        }
    }

    showDetails() {
        this.store.dispatch(actions.showDetails());

        this.requestItem();
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

        const state = this.store.getState();
        if (listMode === 'sort' && state.sortMode !== SORT_MANUALLY) {
            await this.requestSortMode(SORT_MANUALLY);
        }
    }

    startLoading() {
        this.store.dispatch(actions.startLoading());
    }

    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    getContextIds(state) {
        if (state.listMode === 'list') {
            return asArray(state.contextItem);
        }

        return getSelectedIds(state);
    }

    async showItems(value = true) {
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
            const response = (value)
                ? await API.account.show(request)
                : await API.account.hide(request);

            const data = this.getListDataFromResponse(response);
            this.setListData(data);

            App.updateProfileFromResponse(response);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
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
            const response = await API.account.del(request);

            const data = this.getListDataFromResponse(response);
            this.setListData(data);

            App.updateProfileFromResponse(response);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    async requestList(options = {}) {
        const { keepState = false } = options;

        this.startLoading();

        try {
            const request = this.getListRequest();
            const { data } = await API.account.list(request);
            this.setListData(data, keepState);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    getListRequest() {
        return { visibility: 'all' };
    }

    prepareRequest(data) {
        return {
            ...data,
            returnState: {
                accounts: this.getListRequest(),
                profile: {},
            },
        };
    }

    getListDataFromResponse(response) {
        return response?.data?.state?.accounts?.data;
    }

    setListData(data, keepState = false) {
        App.model.accounts.setData(data);
        App.model.userAccounts = null;
        App.checkUserAccountModels();

        this.store.dispatch(actions.listRequestLoaded(keepState));
    }

    async requestItem() {
        const state = this.store.getState();
        if (!state.detailsId) {
            return;
        }

        try {
            const { data } = await API.account.read(state.detailsId);
            const [item] = data;

            this.store.dispatch(actions.itemDetailsLoaded(item));
        } catch (e) {
            App.createErrorNotification(e.message);
        }
    }

    onSort(info) {
        const { userAccounts } = App.model;
        const item = userAccounts.getItem(info.itemId);
        const prevItem = userAccounts.getItem(info.prevId);
        const nextItem = userAccounts.getItem(info.nextId);
        if (!prevItem && !nextItem) {
            return;
        }

        let pos = null;
        if (prevItem) {
            pos = (item.pos < prevItem.pos) ? prevItem.pos : (prevItem.pos + 1);
        } else {
            pos = nextItem.pos;
        }

        this.sendChangePosRequest(item.id, pos);
    }

    /**
     * Sent API request to server to change position of account
     * @param {number} id - identifier of item to change position
     * @param {number} pos - new position of item
     */
    async sendChangePosRequest(id, pos) {
        this.startLoading();

        try {
            const request = this.prepareRequest({ id, pos });
            const response = await API.account.setPos(request);

            const data = this.getListDataFromResponse(response);
            this.setListData(data, true);

            App.updateProfileFromResponse(response);
        } catch (e) {
            this.cancelPosChange();
        }

        this.stopLoading();
    }

    /**
     * Cancel local changes on position update fail
     */
    cancelPosChange() {
        this.render(this.store.getState());

        App.createErrorNotification(__('accounts.errors.changePos'));
    }

    toggleSortByName() {
        const current = getAccountsSortMode();
        const sortMode = (current === SORT_BY_NAME_ASC)
            ? SORT_BY_NAME_DESC
            : SORT_BY_NAME_ASC;

        this.requestSortMode(sortMode);
    }

    toggleSortByDate() {
        const current = getAccountsSortMode();
        const sortMode = (current === SORT_BY_CREATEDATE_ASC)
            ? SORT_BY_CREATEDATE_DESC
            : SORT_BY_CREATEDATE_ASC;

        this.requestSortMode(sortMode);
    }

    async requestSortMode(sortMode) {
        const { settings } = App.model.profile;
        if (settings.sort_accounts === sortMode) {
            return;
        }

        this.startLoading();

        try {
            await API.profile.updateSettings({
                sort_accounts: sortMode,
            });
            settings.sort_accounts = sortMode;

            this.store.dispatch(actions.changeSortMode(sortMode));
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    /**
     * Show account(s) delete confirmation popup
     */
    confirmDelete() {
        const state = this.store.getState();
        const ids = this.getContextIds(state);
        if (ids.length === 0) {
            return;
        }

        const multiple = (ids.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multiple) ? __('accounts.deleteMultiple') : __('accounts.delete'),
            content: (multiple) ? __('accounts.deleteMultipleMessage') : __('accounts.deleteMessage'),
            onConfirm: () => this.deleteItems(),
        });
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = AccountListContextMenu.create({
                id: 'contextMenu',
                onItemClick: (item) => this.onContextMenuClick(item),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.contextMenu.setContext({
            showContextMenu: state.showContextMenu,
            contextItem: state.contextItem,
        });
    }

    renderMenu(state) {
        const itemsCount = state.items.visible.length + state.items.hidden.length;
        const isListMode = state.listMode === 'list';
        const isSortMode = state.listMode === 'sort';

        this.createBtn.show(isListMode);
        this.listModeBtn.show(!isListMode);
        this.menuButton.show(itemsCount > 0 && !isSortMode);

        if (!state.showMenu && !this.menu) {
            return;
        }

        const showFirstTime = !this.menu;
        if (!this.menu) {
            this.menu = AccountListMainMenu.create({
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
            show(this.itemInfo, false);
            return;
        }

        const { userAccounts } = App.model;
        const item = state.detailsItem ?? userAccounts.getItem(state.detailsId);
        if (!item) {
            throw new Error('Account not found');
        }

        if (!this.accountDetails) {
            this.accountDetails = AccountDetails.create({
                item,
                onClose: () => this.closeDetails(),
            });
            this.itemInfo.append(this.accountDetails.elem);
        } else {
            this.accountDetails.setItem(item);
        }

        show(this.itemInfo, true);
    }

    /** Returns URL for specified state */
    getURL(state) {
        const itemPart = (state.detailsId) ? state.detailsId : '';
        return getApplicationURL(`accounts/${itemPart}`);
    }

    renderHistory(state, prevState) {
        if (state.detailsId === prevState?.detailsId) {
            return;
        }

        const url = this.getURL(state);
        const pageTitle = `${__('appName')} | ${__('accounts.listTitle')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    renderList(state) {
        // Counters
        const itemsCount = state.items.visible.length + state.items.hidden.length;
        this.itemsCount.textContent = itemsCount;
        this.hiddenCount.textContent = state.items.hidden.length;
        const isSelectMode = (state.listMode === 'select');
        show(this.selectedCounter, isSelectMode);
        const selected = (isSelectMode) ? getSelectedIds(state) : [];
        this.selItemsCount.textContent = selected.length;

        // Visible accounts
        this.visibleTiles.setState((visibleState) => ({
            ...visibleState,
            items: listData(state.items.visible),
            listMode: state.listMode,
            renderTime: state.renderTime,
        }));

        // Hidden accounts
        this.hiddenTiles.setState((hiddenState) => ({
            ...hiddenState,
            items: listData(state.items.hidden),
            listMode: state.listMode,
        }));

        const hiddenItemsAvailable = (state.items.hidden.length > 0);
        this.hiddenTiles.show(hiddenItemsAvailable);
        show(this.hiddenTilesHeading, hiddenItemsAvailable);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderHistory(state, prevState);

        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.renderList(state);
        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDetails(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(AccountListView);
