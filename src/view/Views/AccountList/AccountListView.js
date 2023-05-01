import 'jezvejs/style';
import {
    asArray,
    insertAfter,
    isFunction,
    show,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { SortableListContainer } from 'jezvejs/SortableListContainer';
import { createStore } from 'jezvejs/Store';
import { Application } from '../../Application/Application.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';
import {
    listData,
    getSortByDateIcon,
    getSortByNameIcon,
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
    __,
} from '../../utils/utils.js';
import { API } from '../../API/index.js';
import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { IconList } from '../../Models/IconList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { AccountDetails } from './components/AccountDetails/AccountDetails.js';
import { actions, createList, reducer } from './reducer.js';
import './AccountListView.scss';

/**
 * List of accounts view
 */
class AccountListView extends View {
    constructor(...args) {
        super(...args);

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.checkUserAccountModels();
        window.app.loadModel(IconList, 'icons', window.app.props.icons);

        const { visibleUserAccounts, hiddenUserAccounts } = window.app.model;
        const { settings } = window.app.model.profile;
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
            noItemsMessage: __('ACCOUNTS_NO_DATA'),
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
            title: __('ACCOUNTS'),
        });

        this.createBtn = Button.create({
            id: 'createBtn',
            type: 'link',
            className: 'circle-btn',
            icon: 'plus',
            url: `${window.app.baseURL}accounts/create/`,
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
        this.contentContainer.append(this.loadingIndicator.elem);

        this.subscribeToStore(this.store);

        if (this.props.detailsId) {
            this.requestItem();
        }
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
                id: 'sortModeBtn',
                icon: 'sort',
                title: __('SORT'),
                onClick: () => this.onMenuClick('sortModeBtn'),
            }, {
                id: 'sortByNameBtn',
                title: __('SORT_BY_NAME'),
                onClick: () => this.onMenuClick('sortByNameBtn'),
            }, {
                id: 'sortByDateBtn',
                title: __('SORT_BY_DATE'),
                onClick: () => this.onMenuClick('sortByDateBtn'),
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
                id: 'exportBtn',
                type: 'link',
                icon: 'export',
                title: __('TR_EXPORT_CSV'),
                onClick: () => this.onMenuClick('exportBtn'),
            }, {
                id: 'showBtn',
                icon: 'show',
                title: __('SHOW'),
                onClick: () => this.onMenuClick('showBtn'),
            }, {
                id: 'hideBtn',
                icon: 'hide',
                title: __('HIDE'),
                onClick: () => this.onMenuClick('hideBtn'),
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('DELETE'),
                onClick: () => this.onMenuClick('deleteBtn'),
            }],
        });

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
                id: 'ctxExportBtn',
                type: 'link',
                icon: 'export',
                title: __('TR_EXPORT_CSV'),
            }, {
                id: 'ctxShowBtn',
                icon: 'show',
                title: __('SHOW'),
                onClick: () => this.showItems(),
            }, {
                id: 'ctxHideBtn',
                icon: 'hide',
                title: __('HIDE'),
                onClick: () => this.showItems(false),
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

    showDetails(e) {
        e?.preventDefault();
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

    getVisibleSelectedItems(state) {
        return state.items.visible.filter((item) => item.selected);
    }

    getHiddenSelectedItems(state) {
        return state.items.hidden.filter((item) => item.selected);
    }

    getSelectedIds(state) {
        const selArr = this.getVisibleSelectedItems(state);
        const hiddenSelArr = this.getHiddenSelectedItems(state);
        return selArr.concat(hiddenSelArr).map((item) => item.id);
    }

    getContextIds(state) {
        if (state.listMode === 'list') {
            return asArray(state.contextItem);
        }

        return this.getSelectedIds(state);
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
        } catch (e) {
            window.app.createErrorNotification(e.message);
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
            const { data } = await API.account.list(request);
            this.setListData(data, keepState);
        } catch (e) {
            window.app.createErrorNotification(e.message);
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
            },
        };
    }

    getListDataFromResponse(response) {
        return response?.data?.state?.accounts?.data;
    }

    setListData(data, keepState = false) {
        window.app.model.accounts.setData(data);
        window.app.model.userAccounts = null;
        window.app.checkUserAccountModels();

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
            window.app.createErrorNotification(e.message);
        }
    }

    onSort(info) {
        const { userAccounts } = window.app.model;
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

        window.app.createErrorNotification(__('ERR_ACCOUNT_CHANGE_POS'));
    }

    getSortMode() {
        return window.app.model.profile.settings.sort_accounts;
    }

    toggleSortByName() {
        const current = this.getSortMode();
        const sortMode = (current === SORT_BY_NAME_ASC)
            ? SORT_BY_NAME_DESC
            : SORT_BY_NAME_ASC;

        this.requestSortMode(sortMode);
    }

    toggleSortByDate() {
        const current = this.getSortMode();
        const sortMode = (current === SORT_BY_CREATEDATE_ASC)
            ? SORT_BY_CREATEDATE_DESC
            : SORT_BY_CREATEDATE_ASC;

        this.requestSortMode(sortMode);
    }

    async requestSortMode(sortMode) {
        const { settings } = window.app.model.profile;
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
            window.app.createErrorNotification(e.message);
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
            title: (multiple) ? __('ACCOUNT_DELETE_MULTIPLE') : __('ACCOUNT_DELETE'),
            content: (multiple) ? __('MSG_ACCOUNT_DELETE_MULTIPLE') : __('MSG_ACCOUNT_DELETE'),
            onConfirm: () => this.deleteItems(),
        });
    }

    /** Returns URL to export transaction of selected accounts */
    getExportURL(selectedIds) {
        const ids = asArray(selectedIds);
        const res = new URL(`${window.app.baseURL}transactions/export/`);
        ids.forEach((id) => {
            res.searchParams.append('acc_id[]', id);
        });
        return res;
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list' || !state.showContextMenu) {
            this.contextMenu?.detach();
            return;
        }
        const account = window.app.model.userAccounts.getItem(state.contextItem);
        if (!account) {
            this.contextMenu?.detach();
            return;
        }
        const tile = document.querySelector(`.tile[data-id="${account.id}"]`);
        if (!tile) {
            this.contextMenu?.detach();
            return;
        }

        if (!this.contextMenu) {
            this.createContextMenu();
        }

        const { baseURL } = window.app;
        const { items } = this.contextMenu;
        items.ctxDetailsBtn.setURL(`${baseURL}accounts/${account.id}`);
        items.ctxUpdateBtn.setURL(`${baseURL}accounts/update/${account.id}`);

        const exportURL = this.getExportURL(account.id);
        items.ctxExportBtn.setURL(exportURL.toString());
        items.ctxShowBtn.show(!account.isVisible());
        items.ctxHideBtn.show(account.isVisible());

        this.contextMenu.attachAndShow(tile);
    }

    renderMenu(state) {
        const itemsCount = state.items.visible.length + state.items.hidden.length;
        const selArr = this.getVisibleSelectedItems(state);
        const hiddenSelArr = this.getHiddenSelectedItems(state);
        const selCount = selArr.length;
        const hiddenSelCount = hiddenSelArr.length;
        const totalSelCount = selCount + hiddenSelCount;
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';
        const isSortMode = state.listMode === 'sort';
        const sortMode = this.getSortMode();

        this.createBtn.show(isListMode);
        this.listModeBtn.show(!isListMode);

        this.menuButton.show(itemsCount > 0 && !isSortMode);

        if (!state.showMenu) {
            this.menu?.hideMenu();
            return;
        }

        const showFirstTime = !this.menu;
        this.createMenu();

        const { items } = this.menu;
        items.selectModeBtn.show(isListMode && itemsCount > 0);

        const showSortItems = isListMode && itemsCount > 1;
        items.sortModeBtn.show(showSortItems);

        items.sortByNameBtn.setIcon(getSortByNameIcon(sortMode));
        items.sortByNameBtn.show(showSortItems);

        items.sortByDateBtn.setIcon(getSortByDateIcon(sortMode));
        items.sortByDateBtn.show(showSortItems);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount > 0);
        show(items.separator2, isSelectMode);

        items.exportBtn.show(isSelectMode && totalSelCount > 0);
        items.showBtn.show(isSelectMode && hiddenSelCount > 0);
        items.hideBtn.show(isSelectMode && selCount > 0);
        items.deleteBtn.show(isSelectMode && totalSelCount > 0);

        if (totalSelCount > 0) {
            const selectedIds = this.getSelectedIds(state);
            const exportURL = this.getExportURL(selectedIds);
            items.exportBtn.setURL(exportURL.toString());
        }

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

        const { userAccounts } = window.app.model;
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
        const { baseURL } = window.app;
        const itemPart = (state.detailsId) ? state.detailsId : '';
        return new URL(`${baseURL}accounts/${itemPart}`);
    }

    renderHistory(state, prevState) {
        if (state.detailsId === prevState?.detailsId) {
            return;
        }

        const url = this.getURL(state);
        const pageTitle = `${__('APP_NAME')} | ${__('ACCOUNTS')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    renderList(state) {
        // Counters
        const itemsCount = state.items.visible.length + state.items.hidden.length;
        this.itemsCount.textContent = itemsCount;
        this.hiddenCount.textContent = state.items.hidden.length;
        const isSelectMode = (state.listMode === 'select');
        show(this.selectedCounter, isSelectMode);
        const selected = (isSelectMode) ? this.getSelectedIds(state) : [];
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

window.app = new Application(window.appProps);
window.app.createView(AccountListView);
