import {
    assert,
    query,
    prop,
    navigation,
    waitForFunction,
    click,
    httpReq,
    asArray,
    goTo,
    baseUrl,
    wait,
    evaluate,
} from 'jezve-test';
import { Button, PopupMenu } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { TilesList } from './component/Tiles/TilesList.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';
import { Counter } from './component/Counter.js';
import { AccountDetails } from './component/Account/AccountDetails.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC, SORT_BY_NAME_DESC,
    SORT_MANUALLY,
} from '../common.js';

const listMenuSelector = '#listMenu';

/** List of accounts view class */
export class AccountListView extends AppView {
    static getExpectedState(model, state = App.state) {
        const sortMode = state.getAccountsSortMode();
        const userAccounts = state.getUserAccounts();
        const itemsCount = userAccounts.length;
        const visibleSelected = this.getSelectedItems(model);
        const hiddenSelected = this.getHiddenSelectedItems(model);
        const totalSelected = visibleSelected.length + hiddenSelected.length;
        const isListMode = model.mode === 'list';
        const isSortMode = model.mode === 'sort';
        const showSelectItems = (
            itemsCount > 0
            && model.listMenuVisible
            && model.mode === 'select'
        );
        const showSortItems = model.listMenuVisible && isListMode && itemsCount > 1;

        const tiles = TilesList.renderAccounts(userAccounts, sortMode);
        const hiddenTiles = TilesList.renderHiddenAccounts(userAccounts, sortMode);

        const res = {
            addBtn: { visible: isListMode },
            listModeBtn: { visible: !isListMode },
            loadingIndicator: { visible: model.loading },
            totalCounter: { visible: true, value: itemsCount },
            hiddenCounter: { visible: true, value: hiddenTiles.items.length },
            selectedCounter: { visible: model.mode === 'select', value: totalSelected },
            menuBtn: { visible: itemsCount > 0 && !isSortMode },
            tiles,
            hiddenTiles,
        };

        res.tiles.visible = true;
        res.tiles.noDataMsg = {
            visible: res.tiles.items.length === 0,
        };
        res.hiddenTiles.visible = res.hiddenTiles.items.length > 0;

        if (model.detailsItem) {
            res.itemInfo = AccountDetails.render(model.detailsItem, App.state);
            res.itemInfo.visible = true;
        }

        if (model.listMenuVisible) {
            res.listMenu = {
                visible: true,
                selectModeBtn: { visible: isListMode && itemsCount > 0 },
                sortModeBtn: { visible: showSortItems },
                sortByNameBtn: { visible: showSortItems },
                sortByDateBtn: { visible: showSortItems },
                selectAllBtn: { visible: showSelectItems && totalSelected < itemsCount },
                deselectAllBtn: { visible: showSelectItems && totalSelected > 0 },
                exportBtn: { visible: showSelectItems && (totalSelected > 0) },
                showBtn: { visible: showSelectItems && (hiddenSelected.length > 0) },
                deleteBtn: { visible: showSelectItems && (totalSelected > 0) },
                hideBtn: { visible: showSelectItems && (visibleSelected.length > 0) },
            };
        }

        if (model.contextMenuVisible) {
            const ctxAccount = App.state.accounts.getItem(model.contextItem);
            assert(ctxAccount, 'Invalid state');

            const isHidden = App.state.accounts.isHidden(ctxAccount);

            res.contextMenu = {
                visible: true,
                itemId: model.contextItem,
                ctxDetailsBtn: { visible: true },
                ctxUpdateBtn: { visible: true },
                ctxExportBtn: { visible: true },
                ctxShowBtn: { visible: isHidden },
                ctxHideBtn: { visible: !isHidden },
                ctxDeleteBtn: { visible: true },
            };
        }

        return res;
    }

    static getSelectedItems(model) {
        return model?.tiles?.filter((item) => item.isActive) ?? [];
    }

    static getHiddenSelectedItems(model) {
        return model?.hiddenTiles?.filter((item) => item.isActive) ?? [];
    }

    static getInitialState(options = {}, state = App.state) {
        const {
            detailsItem = null,
        } = options;

        const model = {
            locale: App.view.locale,
            mode: 'list',
            loading: false,
            listMenuVisible: false,
            contextMenuVisible: false,
            detailsItem,
        };

        return AccountListView.getExpectedState(model, state);
    }

    get listMenu() {
        return this.content.listMenu;
    }

    get contextMenu() {
        return this.content.contextMenu;
    }

    async parseContent() {
        const res = {
            addBtn: await Button.create(this, await query('#createBtn')),
            listModeBtn: await Button.create(this, await query('#listModeBtn')),
            menuBtn: { elem: await query('.heading-actions .menu-btn') },
            totalCounter: await Counter.create(this, await query('#itemsCounter')),
            hiddenCounter: await Counter.create(this, await query('#hiddenCounter')),
            selectedCounter: await Counter.create(this, await query('#selectedCounter')),
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of view: ${child} component not found`)
        ));

        // Main menu
        res.listMenu = await PopupMenu.create(this, await query(listMenuSelector));

        // Context menu
        res.contextMenu = await PopupMenu.create(this, await query('#contextMenu'));
        if (res.contextMenu?.elem) {
            res.contextMenu.content.itemId = await evaluate((menuEl) => (
                menuEl?.previousElementSibling?.classList.contains('tile')
                    ? parseInt(menuEl.previousElementSibling.dataset.id, 10)
                    : null
            ), res.contextMenu.elem);
        }

        res.tiles = await TilesList.create(this, await query('#contentContainer .tiles:first-child'));
        res.hiddenTiles = await TilesList.create(this, await query('#hiddenTilesHeading + .tiles'));
        res.loadingIndicator = { elem: await query('#contentContainer .loading-indicator') };
        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        res.itemInfo = await AccountDetails.create(this, await query('#itemInfo .list-item-details'));

        res.renderTime = await prop(res.tiles.elem, 'dataset.time');

        return res;
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            tiles: cont.tiles.getItems(),
            hiddenTiles: cont.hiddenTiles.getItems(),
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            contextItem: cont.contextMenu?.content?.itemId,
            mode: cont.tiles.listMode,
            sortMode: App.state.getAccountsSortMode(),
            listMenuVisible: cont.listMenu?.visible,
            contextMenuVisible: cont.contextMenu?.visible,
            detailsItem: this.getDetailsItem(this.getDetailsId()),
        };

        return res;
    }

    getDetailsId() {
        const viewPath = '/accounts/';
        const { pathname } = new URL(this.location);
        assert(pathname.startsWith(viewPath), `Invalid location path: ${pathname}`);

        if (pathname.length === viewPath.length) {
            return 0;
        }

        const param = pathname.substring(viewPath.length);
        return parseInt(param, 10) ?? 0;
    }

    getDetailsItem(itemId) {
        return App.state.getUserAccounts().getItem(itemId);
    }

    getExpectedURL(model = this.model) {
        let res = `${baseUrl()}accounts/`;

        if (model.detailsItem) {
            res += model.detailsItem.id.toString();
        }

        return res;
    }

    getExpectedState(model = this.model) {
        return AccountListView.getExpectedState(model);
    }

    onDeselectAll() {
        const deselectItem = (item) => ({ ...item, isActive: false });

        this.model.tiles = this.model.tiles.map(deselectItem);
        this.model.hiddenTiles = this.model.hiddenTiles.map(deselectItem);
    }

    getItems() {
        const visibleItems = this.content.tiles.getItems();
        const hiddenItems = this.content.hiddenTiles.getItems();

        return visibleItems.concat(hiddenItems);
    }

    /** Click on add button and return navigation promise */
    async goToCreateAccount() {
        await navigation(() => this.content.addBtn.click());
    }

    /** Clicks by 'Show details' context menu item of specified account */
    async showDetails(num, directNavigate = false) {
        const item = this.getItemByIndex(num);

        if (!directNavigate) {
            await this.openContextMenu(num);
        }

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        this.model.detailsItem = this.getDetailsItem(item.id);
        assert(this.model.detailsItem, 'Item not found');
        const expected = this.getExpectedState();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.performAction(() => this.contextMenu.select('ctxDetailsBtn'));
        }

        await waitForFunction(async () => {
            await this.parse();
            return (!this.content.itemInfo.loading);
        });

        return App.view.checkState(expected);
    }

    /** Closes item details */
    async closeDetails(directNavigate = false) {
        assert(this.model.detailsItem, 'Details already closed');

        this.model.detailsItem = null;
        const expected = this.getExpectedState();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.performAction(() => this.content.itemInfo.close());
        }

        return App.view.checkState(expected);
    }

    /** Clicks by 'Edit' context menu item of specified account */
    async goToUpdateAccount(num) {
        await this.openContextMenu(num);

        await navigation(() => this.contextMenu.select('ctxUpdateBtn'));
    }

    async waitForList(action) {
        await this.parse();

        const prevTime = this.model.renderTime;
        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.loading
                && prevTime !== this.model.renderTime
            );
        });

        await this.parse();
    }

    getItemByIndex(index, model = this.model) {
        const visibleTiles = model.tiles.length;
        const hiddenTiles = model.hiddenTiles.length;
        const totalTiles = visibleTiles + hiddenTiles;

        assert(index >= 0 && index < totalTiles, 'Invalid account number');

        return (index < visibleTiles)
            ? model.tiles[index]
            : model.hiddenTiles[index - visibleTiles];
    }

    getTileByIndex(index, model = this.model) {
        const visibleTiles = model.tiles.length;
        const hiddenTiles = model.hiddenTiles.length;
        const totalTiles = visibleTiles + hiddenTiles;

        assert(index >= 0 && index < totalTiles, 'Invalid account number');

        return (index < visibleTiles)
            ? this.content.tiles.items[index]
            : this.content.hiddenTiles.items[index - visibleTiles];
    }

    async openContextMenu(num) {
        await this.setListMode();

        const item = this.getItemByIndex(num);

        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.getExpectedState();

        const tile = this.getTileByIndex(num);
        await this.performAction(async () => {
            await tile.click();
            return wait('#ctxDeleteBtn', { visible: true });
        });

        return this.checkState(expected);
    }

    async openListMenu() {
        assert(!this.listMenu?.visible, 'List menu already opened');

        this.model.listMenuVisible = true;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            assert(this.content.menuBtn.visible, 'Menu button not visible');
            await click(this.content.menuBtn.elem);
            return wait(listMenuSelector, { visible: true });
        });

        return this.checkState(expected);
    }

    async closeListMenu() {
        assert(this.listMenu?.visible, 'List menu not opened');

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            assert(this.content.menuBtn.visible, 'Menu button not visible');
            await click(this.content.menuBtn.elem);
            return wait(listMenuSelector, { visible: false });
        });

        return this.checkState(expected);
    }

    async changeListMode(listMode) {
        if (this.model.mode === listMode) {
            return true;
        }

        assert(
            this.model.mode === 'list' || listMode === 'list',
            `Can't change list mode from ${this.model.mode} to ${listMode}.`,
        );

        if (listMode !== 'list') {
            await this.openListMenu();
        }

        this.model.listMenuVisible = false;
        this.model.mode = listMode;
        this.onDeselectAll();
        if (listMode === 'sort') {
            this.model.sortMode = SORT_MANUALLY;
            App.state.updateSettings({
                sort_accounts: this.model.sortMode,
            });
        }

        const expected = this.getExpectedState();

        if (listMode === 'list') {
            await this.performAction(() => this.content.listModeBtn.click());
        } else if (listMode === 'select') {
            await this.performAction(() => this.listMenu.select('selectModeBtn'));
        } else if (listMode === 'sort') {
            await this.waitForList(() => this.listMenu.select('sortModeBtn'));
        }

        return this.checkState(expected);
    }

    async setListMode() {
        return this.changeListMode('list');
    }

    async setSelectMode() {
        return this.changeListMode('select');
    }

    async setSortMode() {
        return this.changeListMode('sort');
    }

    async toggleSortByName() {
        await this.setListMode();
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.sortMode = (this.model.sortMode === SORT_BY_NAME_ASC)
            ? SORT_BY_NAME_DESC
            : SORT_BY_NAME_ASC;

        App.state.updateSettings({
            sort_accounts: this.model.sortMode,
        });

        const expected = this.getExpectedState();

        await this.waitForList(() => this.listMenu.select('sortByNameBtn'));

        return this.checkState(expected);
    }

    async toggleSortByDate() {
        await this.setListMode();
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.sortMode = (this.model.sortMode === SORT_BY_CREATEDATE_ASC)
            ? SORT_BY_CREATEDATE_DESC
            : SORT_BY_CREATEDATE_ASC;

        App.state.updateSettings({
            sort_accounts: this.model.sortMode,
        });

        const expected = this.getExpectedState();

        await this.waitForList(() => this.listMenu.select('sortByDateBtn'));

        return this.checkState(expected);
    }

    async selectAccounts(data) {
        assert.isDefined(data, 'No accounts specified');

        await this.setSelectMode();

        const accounts = asArray(data);
        for (const num of accounts) {
            const item = this.getItemByIndex(num);
            item.isActive = !item.isActive;

            const expected = this.getExpectedState();

            const tile = this.getTileByIndex(num);
            await this.performAction(() => tile.click());

            this.checkState(expected);
        }
    }

    async selectAll() {
        const selectItem = (item) => ({ ...item, isActive: true });

        await this.setSelectMode();
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.tiles = this.model.tiles.map(selectItem);
        this.model.hiddenTiles = this.model.hiddenTiles.map(selectItem);
        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('selectAllBtn'));

        return this.checkState(expected);
    }

    async deselectAll() {
        assert(this.model.mode === 'select', 'Invalid state');

        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.onDeselectAll();
        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('deselectAllBtn'));

        return this.checkState(expected);
    }

    /** Delete secified account from context menu */
    async deleteFromContextMenu(index) {
        await this.openContextMenu(index);

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        const expected = this.getExpectedState();

        await this.performAction(() => this.contextMenu.select('ctxDeleteBtn'));

        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete account warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }

    /** Delete secified accounts and return navigation promise */
    async deleteAccounts(data) {
        await this.selectAccounts(data);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('deleteBtn'));
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete account warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }

    /** Show secified accounts */
    async showAccounts(acc, val = true) {
        await this.selectAccounts(acc);

        await this.openListMenu();

        await this.waitForList(() => (
            this.listMenu.select((val) ? 'showBtn' : 'hideBtn')
        ));
    }

    /** Hide secified accounts and return navigation promise */
    async hideAccounts(acc) {
        await this.showAccounts(acc, false);
    }

    /** Export transactions of specified accounts */
    async exportAccounts(acc) {
        await this.selectAccounts(acc);
        await this.openListMenu();

        const exportBtn = this.listMenu.findItemById('exportBtn');
        const downloadURL = exportBtn.link;
        assert(downloadURL, 'Invalid export URL');

        const exportResp = await httpReq('GET', downloadURL);
        assert(exportResp?.status === 200, 'Invalid response');

        await this.setListMode();

        return exportResp.body;
    }
}
