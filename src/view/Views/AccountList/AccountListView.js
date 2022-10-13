import 'jezvejs/style';
import {
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
import { Toolbar } from '../../Components/Toolbar/Toolbar.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import '../../Components/Tile/style.scss';
import '../../Components/IconButton/style.scss';

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

        this.loadingIndicator = LoadingIndicator.create();
        insertAfter(this.loadingIndicator.elem, this.hiddenTilesContainer);

        this.toolbar = Toolbar.create({
            elem: 'toolbar',
            onshow: () => this.showSelected(),
            onhide: () => this.showSelected(false),
            ondelete: () => this.confirmDelete(),
        });

        this.render(this.state);
    }

    /**
     * Tile click event handler
     */
    onTileClick(e) {
        if (!e || !e.target) {
            return;
        }

        const tile = e.target.closest('.tile');
        if (!tile || !tile.dataset) {
            return;
        }

        const accountId = parseInt(tile.dataset.id, 10);
        const account = window.app.model.accounts.getItem(accountId);
        if (!account) {
            return;
        }

        const toggleItem = (item) => (
            (item.id === accountId)
                ? { ...item, selected: !item.selected }
                : item
        );

        if (account.isVisible()) {
            this.state.items.visible = this.state.items.visible.map(toggleItem);
        } else {
            this.state.items.hidden = this.state.items.hidden.map(toggleItem);
        }

        this.render(this.state);
        this.setRenderTime();
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

    async showSelected(value = true) {
        if (this.state.loading) {
            return;
        }
        const selectedIds = this.getSelectedIds();
        if (selectedIds.length === 0) {
            return;
        }

        this.startLoading();

        try {
            if (value) {
                await API.account.show({ id: selectedIds });
            } else {
                await API.account.hide({ id: selectedIds });
            }
            this.requestList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    async deleteSelected() {
        if (this.state.loading) {
            return;
        }
        const selectedIds = this.getSelectedIds();
        if (selectedIds.length === 0) {
            return;
        }

        this.startLoading();

        try {
            await API.account.del({ id: selectedIds });
            this.requestList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    async requestList() {
        try {
            const { data } = await API.account.list({ type: 'all' });
            window.app.model.accounts.setData(data);
            window.app.model.userAccounts = null;
            window.app.checkUserAccountModels();

            this.setState({
                ...this.state,
                items: {
                    visible: AccountList.create(window.app.model.visibleUserAccounts),
                    hidden: AccountList.create(window.app.model.hiddenUserAccounts),
                },
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
        const selectedIds = this.getSelectedIds();
        if (selectedIds.length === 0) {
            return;
        }

        const multiple = (selectedIds.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multiple) ? TITLE_MULTI_ACC_DELETE : TITLE_SINGLE_ACC_DELETE,
            content: (multiple) ? MSG_MULTI_ACC_DELETE : MSG_SINGLE_ACC_DELETE,
            onconfirm: () => this.deleteSelected(),
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

        const selArr = this.getVisibleSelectedItems(state);
        const hiddenSelArr = this.getHiddenSelectedItems(state);
        const selCount = selArr.length;
        const hiddenSelCount = hiddenSelArr.length;
        const totalSelCount = selCount + hiddenSelCount;
        this.toolbar.updateBtn.show(totalSelCount === 1);
        this.toolbar.exportBtn.show(totalSelCount > 0);
        this.toolbar.showBtn.show(hiddenSelCount > 0);
        this.toolbar.hideBtn.show(selCount > 0);
        this.toolbar.deleteBtn.show(totalSelCount > 0);

        const { baseURL } = window.app;
        const selectedIds = this.getSelectedIds();
        if (selectedIds.length === 1) {
            this.toolbar.updateBtn.setURL(`${baseURL}accounts/update/${selectedIds[0]}`);
        }

        if (totalSelCount > 0) {
            let exportURL = `${baseURL}accounts/export/`;
            if (totalSelCount === 1) {
                exportURL += selectedIds[0];
            } else {
                exportURL += `?${urlJoin({ id: selectedIds })}`;
            }
            this.toolbar.exportBtn.setURL(exportURL);
        }

        this.toolbar.show(totalSelCount > 0);

        this.tilesContainer.dataset.time = state.renderTime;
        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(AccountListView);
