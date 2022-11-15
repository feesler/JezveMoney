import 'jezvejs/style';
import {
    asArray,
    ge,
    insertAfter,
    show,
    urlJoin,
} from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { IconList } from '../../js/model/IconList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { ListContainer } from '../../Components/ListContainer/ListContainer.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { createStore } from '../../js/store.js';
import { actions, reducer } from './reducer.js';
import './style.scss';

/** Strings */
const TITLE_SINGLE_ACC_DELETE = 'Delete account';
const TITLE_MULTI_ACC_DELETE = 'Delete accounts';
const MSG_MULTI_ACC_DELETE = 'Are you sure want to delete selected accounts?<br>All income and expense transactions history will be lost. Transfer to this accounts will be changed to expense. Transfer from this accounts will be changed to income.';
const MSG_SINGLE_ACC_DELETE = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';
const MSG_NO_ACCOUNTS = 'You have no one account. Please create one.';

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

        const initialState = {
            items: {
                visible: AccountList.create(window.app.model.visibleUserAccounts),
                hidden: AccountList.create(window.app.model.hiddenUserAccounts),
            },
            loading: false,
            listMode: 'list',
            contextItem: null,
            renderTime: Date.now(),
        };

        this.store = createStore(reducer, initialState);
        this.store.subscribe((state, prevState) => {
            if (state !== prevState) {
                this.render(state, prevState);
            }
        });
    }

    /**
     * View initialization
     */
    onStart() {
        const state = this.store.getState();
        const listProps = {
            ItemComponent: AccountTile,
            getItemProps: (account, { listMode }) => ({
                type: 'button',
                account,
                attrs: { 'data-id': account.id },
                selected: account.selected,
                selectMode: listMode === 'select',
            }),
            className: 'tiles',
            itemSelector: '.tile',
            listMode: state.listMode,
            noItemsMessage: MSG_NO_ACCOUNTS,
            onItemClick: (id, e) => this.onItemClick(id, e),
        };

        const visibleTilesHeading = ge('visibleTilesHeading');
        this.hiddenTilesHeading = ge('hiddenTilesHeading');
        if (!visibleTilesHeading || !this.hiddenTilesHeading) {
            throw new Error('Failed to initialize Account List view');
        }

        this.visibleTiles = ListContainer.create(listProps);
        insertAfter(this.visibleTiles.elem, visibleTilesHeading);

        this.hiddenTiles = ListContainer.create(listProps);
        insertAfter(this.hiddenTiles.elem, this.hiddenTilesHeading);

        this.createBtn = ge('add_btn');
        this.createMenu();
        insertAfter(this.menu.elem, this.createBtn);

        this.createContextMenu();

        this.loadingIndicator = LoadingIndicator.create();
        insertAfter(this.loadingIndicator.elem, this.hiddenTiles.elem);

        this.render(state);
    }

    createMenu() {
        this.menu = PopupMenu.create({
            id: 'listMenu',
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: 'Select',
                onClick: () => this.toggleSelectMode(),
            }, {
                id: 'separator1',
                type: 'separator',
            }, {
                id: 'selectAllBtn',
                title: 'Select all',
                onClick: () => this.selectAll(),
            }, {
                id: 'deselectAllBtn',
                title: 'Clear selection',
                onClick: () => this.deselectAll(),
            }, {
                id: 'separator2',
                type: 'separator',
            }, {
                id: 'exportBtn',
                type: 'link',
                icon: 'export',
                title: 'Export to CSV',
            }, {
                id: 'showBtn',
                icon: 'show',
                title: 'Restore',
                onClick: () => this.showItems(),
            }, {
                id: 'hideBtn',
                icon: 'hide',
                title: 'Hide',
                onClick: () => this.showItems(false),
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: 'Delete',
                onClick: () => this.confirmDelete(),
            }],
        });
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            attached: true,
            items: [{
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: 'Edit',
            }, {
                id: 'ctxExportBtn',
                type: 'link',
                icon: 'export',
                title: 'Export to CSV',
            }, {
                id: 'ctxShowBtn',
                icon: 'show',
                title: 'Restore',
                onClick: () => this.showItems(),
            }, {
                id: 'ctxHideBtn',
                icon: 'hide',
                title: 'Hide',
                onClick: () => this.showItems(false),
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: 'Delete',
                onClick: () => this.confirmDelete(),
            }],
        });
    }

    onItemClick(itemId, e) {
        const { listMode } = this.store.getState();
        if (listMode === 'list') {
            this.showContextMenu(itemId);
        } else if (listMode === 'select') {
            if (e?.target?.closest('.checkbox')) {
                e.preventDefault();
            }

            this.toggleSelectItem(itemId);
        }
    }

    showContextMenu(itemId) {
        this.store.dispatch(actions.showContextMenu(itemId));
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

    toggleSelectMode() {
        this.store.dispatch(actions.toggleSelectMode());
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
            if (value) {
                await API.account.show({ id: ids });
            } else {
                await API.account.hide({ id: ids });
            }
            this.requestList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
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
            await API.account.del({ id: ids });
            this.requestList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    async requestList() {
        try {
            const { data } = await API.account.list({ visibility: 'all' });
            window.app.model.accounts.setData(data);
            window.app.model.userAccounts = null;
            window.app.checkUserAccountModels();

            this.store.dispatch(actions.listRequestLoaded());
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
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
            title: (multiple) ? TITLE_MULTI_ACC_DELETE : TITLE_SINGLE_ACC_DELETE,
            content: (multiple) ? MSG_MULTI_ACC_DELETE : MSG_SINGLE_ACC_DELETE,
            onconfirm: () => this.deleteItems(),
        });
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list') {
            this.contextMenu.detach();
            return;
        }
        const account = window.app.model.userAccounts.getItem(state.contextItem);
        if (!account) {
            this.contextMenu.detach();
            return;
        }
        const tile = document.querySelector(`.tile[data-id="${account.id}"]`);
        if (!tile) {
            this.contextMenu.detach();
            return;
        }

        const { baseURL } = window.app;
        const { items } = this.contextMenu;
        items.ctxUpdateBtn.setURL(`${baseURL}accounts/update/${account.id}`);
        items.ctxExportBtn.setURL(`${baseURL}accounts/export/${account.id}`);
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
        const isSelectMode = (state.listMode === 'select');

        this.menu.show(itemsCount > 0);
        const { items } = this.menu;

        const selectModeTitle = (isSelectMode) ? 'Done' : 'Select';
        items.selectModeBtn.setTitle(selectModeTitle);
        items.selectModeBtn.setIcon((isSelectMode) ? null : 'select');
        show(items.separator1, isSelectMode);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount > 0);
        show(items.separator2, isSelectMode);

        items.exportBtn.show(isSelectMode && totalSelCount > 0);
        items.showBtn.show(isSelectMode && hiddenSelCount > 0);
        items.hideBtn.show(isSelectMode && selCount > 0);
        items.deleteBtn.show(isSelectMode && totalSelCount > 0);

        const { baseURL } = window.app;
        const selectedIds = this.getSelectedIds(state);

        if (totalSelCount > 0) {
            let exportURL = `${baseURL}accounts/export/`;
            if (totalSelCount === 1) {
                exportURL += selectedIds[0];
            } else {
                exportURL += `?${urlJoin({ id: selectedIds })}`;
            }
            items.exportBtn.setURL(exportURL);
        }
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.loading) {
            this.loadingIndicator.show();
        }

        // Render visible accounts
        this.visibleTiles.setState((visibleState) => ({
            ...visibleState,
            items: state.items.visible,
            listMode: state.listMode,
            renderTime: Date.now(),
        }));
        // Render hidden accounts
        this.hiddenTiles.setState((hiddenState) => ({
            ...hiddenState,
            items: state.items.hidden,
            listMode: state.listMode,
        }));

        const hiddenItemsAvailable = (state.items.hidden.length > 0);
        this.hiddenTiles.show(hiddenItemsAvailable);
        show(this.hiddenTilesHeading, hiddenItemsAvailable);

        this.renderContextMenu(state);
        this.renderMenu(state);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(AccountListView);
