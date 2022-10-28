import 'jezvejs/style';
import {
    asArray,
    ge,
    createElement,
    setEvents,
    removeChilds,
    insertAfter,
    show,
    urlJoin,
} from 'jezvejs';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { IconList } from '../../js/model/IconList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { PopupMenu } from '../../Components/PopupMenu/PopupMenu.js';
import './style.scss';

/** CSS classes */
const NO_DATA_CLASS = 'nodata-message';
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

        this.state = {
            items: {
                visible: AccountList.create(window.app.model.visibleUserAccounts),
                hidden: AccountList.create(window.app.model.hiddenUserAccounts),
            },
            loading: false,
            mode: 'list',
            contextItem: null,
            renderTime: Date.now(),
        };
    }

    /**
     * View initialization
     */
    onStart() {
        this.tilesContainer = ge('tilesContainer');
        this.hiddenTilesHeading = ge('hiddenTilesHeading');
        this.hiddenTilesContainer = ge('hiddenTilesContainer');
        if (
            !this.tilesContainer
            || !this.hiddenTilesHeading
            || !this.hiddenTilesContainer
        ) {
            throw new Error('Failed to initialize Account List view');
        }
        const tileEvents = { click: (e) => this.onTileClick(e) };
        setEvents(this.tilesContainer, tileEvents);
        setEvents(this.hiddenTilesContainer, tileEvents);

        this.createBtn = ge('add_btn');
        this.createMenu();
        insertAfter(this.menu.elem, this.createBtn);

        this.createContextMenu();

        this.loadingIndicator = LoadingIndicator.create();
        insertAfter(this.loadingIndicator.elem, this.hiddenTilesContainer);

        this.render(this.state);
    }

    createMenu() {
        this.menu = PopupMenu.create({ id: 'listMenu' });

        this.selectModeBtn = this.menu.addIconItem({
            id: 'selectModeBtn',
            icon: 'select',
            title: 'Select',
            onClick: () => this.toggleSelectMode(),
        });
        this.separator1 = this.menu.addSeparator();

        this.selectAllBtn = this.menu.addIconItem({
            id: 'selectAllBtn',
            title: 'Select all',
            onClick: () => this.selectAll(),
        });
        this.deselectAllBtn = this.menu.addIconItem({
            id: 'deselectAllBtn',
            title: 'Clear selection',
            onClick: () => this.deselectAll(),
        });
        this.separator2 = this.menu.addSeparator();

        this.exportBtn = this.menu.addIconItem({
            id: 'exportBtn',
            type: 'link',
            icon: 'export',
            title: 'Export to CSV',
        });
        this.showBtn = this.menu.addIconItem({
            id: 'showBtn',
            icon: 'show',
            title: 'Restore',
            onClick: () => this.showItems(),
        });
        this.hideBtn = this.menu.addIconItem({
            id: 'hideBtn',
            icon: 'hide',
            title: 'Hide',
            onClick: () => this.showItems(false),
        });
        this.deleteBtn = this.menu.addIconItem({
            id: 'deleteBtn',
            icon: 'del',
            title: 'Delete',
            onClick: () => this.confirmDelete(),
        });
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            attachTo: this.tilesContainer,
        });

        this.ctxUpdateBtn = this.contextMenu.addIconItem({
            id: 'ctxUpdateBtn',
            type: 'link',
            icon: 'update',
            title: 'Edit',
        });
        this.ctxExportBtn = this.contextMenu.addIconItem({
            id: 'ctxExportBtn',
            type: 'link',
            icon: 'export',
            title: 'Export to CSV',
        });
        this.ctxShowBtn = this.contextMenu.addIconItem({
            id: 'ctxShowBtn',
            icon: 'show',
            title: 'Restore',
            onClick: () => this.showItems(),
        });
        this.ctxHideBtn = this.contextMenu.addIconItem({
            id: 'ctxHideBtn',
            icon: 'hide',
            title: 'Hide',
            onClick: () => this.showItems(false),
        });
        this.ctxDeleteBtn = this.contextMenu.addIconItem({
            id: 'ctxDeleteBtn',
            icon: 'del',
            title: 'Delete',
            onClick: () => this.confirmDelete(),
        });
    }

    /**
     * Tile click event handler
     */
    onTileClick(e) {
        const tile = e?.target?.closest('.tile');
        const itemId = parseInt(tile?.dataset?.id, 10);
        const account = window.app.model.userAccounts.getItem(itemId);
        if (!account) {
            return;
        }

        if (this.state.mode === 'list') {
            this.showContextMenu(itemId);
        } else if (this.state.mode === 'select') {
            this.toggleSelectItem(itemId);
            this.setRenderTime();
        }
    }

    showContextMenu(itemId) {
        if (this.state.contextItem === itemId) {
            return;
        }

        this.setState({ ...this.state, contextItem: itemId });
    }

    toggleSelectItem(itemId) {
        const account = window.app.model.userAccounts.getItem(itemId);
        if (!account) {
            return;
        }

        const toggleItem = (item) => (
            (item.id === itemId)
                ? { ...item, selected: !item.selected }
                : item
        );

        const { visible, hidden } = this.state.items;
        this.setState({
            ...this.state,
            items: {
                visible: (account.isVisible()) ? visible.map(toggleItem) : visible,
                hidden: (!account.isVisible()) ? hidden.map(toggleItem) : hidden,
            },
        });
    }

    reduceSelectAll(state = this.state) {
        const selectItem = (item) => (
            (item.selected)
                ? item
                : { ...item, selected: true }
        );

        return {
            ...state,
            items: {
                visible: state.items.visible.map(selectItem),
                hidden: state.items.hidden.map(selectItem),
            },
        };
    }

    reduceDeselectAll(state = this.state) {
        const deselectItem = (item) => (
            (item.selected)
                ? { ...item, selected: false }
                : item
        );

        return {
            ...state,
            items: {
                visible: state.items.visible.map(deselectItem),
                hidden: state.items.hidden.map(deselectItem),
            },
        };
    }

    selectAll() {
        this.setState(this.reduceSelectAll());
        this.setRenderTime();
    }

    deselectAll() {
        this.setState(this.reduceDeselectAll());
        this.setRenderTime();
    }

    toggleSelectMode() {
        let newState = {
            ...this.state,
            mode: (this.state.mode === 'list') ? 'select' : 'list',
            contextItem: null,
        };
        if (newState.mode === 'list') {
            newState = this.reduceDeselectAll(newState);
        }

        this.setState(newState);
    }

    startLoading() {
        if (this.state.loading) {
            return;
        }

        this.setState({ ...this.state, loading: true });
    }

    stopLoading() {
        if (!this.state.loading) {
            return;
        }

        this.setState({ ...this.state, loading: false });
    }

    setRenderTime() {
        this.setState({ ...this.state, renderTime: Date.now() });
    }

    getVisibleSelectedItems(state = this.state) {
        return state.items.visible.filter((item) => item.selected);
    }

    getHiddenSelectedItems(state = this.state) {
        return state.items.hidden.filter((item) => item.selected);
    }

    getSelectedIds(state = this.state) {
        const selArr = this.getVisibleSelectedItems(state);
        const hiddenSelArr = this.getHiddenSelectedItems(state);
        return selArr.concat(hiddenSelArr).map((item) => item.id);
    }

    getContextIds(state = this.state) {
        if (state.mode === 'list') {
            return asArray(state.contextItem);
        }

        return this.getSelectedIds(state);
    }

    async showItems(value = true) {
        if (this.state.loading) {
            return;
        }

        const ids = this.getContextIds();
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
        if (this.state.loading) {
            return;
        }

        const ids = this.getContextIds();
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

            this.setState({
                ...this.state,
                items: {
                    visible: AccountList.create(window.app.model.visibleUserAccounts),
                    hidden: AccountList.create(window.app.model.hiddenUserAccounts),
                },
                mode: 'list',
                contextItem: null,
            });
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }

        this.stopLoading();
        this.setRenderTime();
    }

    /**
     * Show account(s) delete confirmation popup
     */
    confirmDelete() {
        const ids = this.getContextIds();
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

    renderTilesList(accounts) {
        return accounts.map((account) => AccountTile.create({
            type: 'button',
            account,
            attrs: { 'data-id': account.id },
            selected: account.selected,
        }));
    }

    renderContextMenu(state) {
        if (state.mode !== 'list') {
            this.contextMenu.detach();
            return;
        }

        const { contextItem } = state;
        if (!contextItem) {
            return;
        }
        const account = window.app.model.userAccounts.getItem(contextItem);
        if (!account) {
            return;
        }

        const tile = document.querySelector(`.tile[data-id="${account.id}"]`);
        if (!tile) {
            return;
        }

        if (this.contextMenu.menuList.parentNode !== tile) {
            PopupMenu.hideActive();
            this.contextMenu.attachTo(tile);
            this.contextMenu.toggleMenu();
        }

        const { baseURL } = window.app;
        this.ctxUpdateBtn.setURL(`${baseURL}accounts/update/${account.id}`);
        this.ctxExportBtn.setURL(`${baseURL}accounts/export/${account.id}`);
        this.ctxShowBtn.show(!account.isVisible());
        this.ctxHideBtn.show(account.isVisible());
    }

    renderMenu(state) {
        const itemsCount = state.items.visible.length + state.items.hidden.length;
        const selArr = this.getVisibleSelectedItems(state);
        const hiddenSelArr = this.getHiddenSelectedItems(state);
        const selCount = selArr.length;
        const hiddenSelCount = hiddenSelArr.length;
        const totalSelCount = selCount + hiddenSelCount;
        const isSelectMode = (state.mode === 'select');

        const selectModeTitle = (isSelectMode) ? 'Cancel' : 'Select';
        this.selectModeBtn.setTitle(selectModeTitle);
        this.selectModeBtn.setIcon((isSelectMode) ? null : 'select');
        show(this.separator1, isSelectMode);

        this.selectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount);
        this.deselectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount > 0);
        show(this.separator2, isSelectMode);

        this.exportBtn.show(isSelectMode && totalSelCount > 0);
        this.showBtn.show(isSelectMode && hiddenSelCount > 0);
        this.hideBtn.show(isSelectMode && selCount > 0);
        this.deleteBtn.show(isSelectMode && totalSelCount > 0);

        const { baseURL } = window.app;
        const selectedIds = this.getSelectedIds(state);

        if (totalSelCount > 0) {
            let exportURL = `${baseURL}accounts/export/`;
            if (totalSelCount === 1) {
                exportURL += selectedIds[0];
            } else {
                exportURL += `?${urlJoin({ id: selectedIds })}`;
            }
            this.exportBtn.setURL(exportURL);
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
        const visibleTiles = this.renderTilesList(state.items.visible);
        removeChilds(this.tilesContainer);
        if (visibleTiles.length > 0) {
            visibleTiles.forEach((item) => this.tilesContainer.appendChild(item.elem));
        } else {
            const noDataMsg = createElement('span', {
                props: { className: NO_DATA_CLASS, textContent: MSG_NO_ACCOUNTS },
            });
            this.tilesContainer.append(noDataMsg);
        }

        // Render hidden accounts
        const hiddenTiles = this.renderTilesList(state.items.hidden);
        removeChilds(this.hiddenTilesContainer);
        const hiddenItemsAvailable = (hiddenTiles.length > 0);
        if (hiddenItemsAvailable) {
            hiddenTiles.forEach((item) => this.hiddenTilesContainer.appendChild(item.elem));
        }
        show(this.hiddenTilesHeading, hiddenItemsAvailable);

        this.renderContextMenu(state);
        this.renderMenu(state);

        this.tilesContainer.dataset.time = state.renderTime;

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(AccountListView);
