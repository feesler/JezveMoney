import {
    assert,
    query,
    prop,
    navigation,
    waitForFunction,
    click,
    httpReq,
    closest,
    asArray,
    asyncMap,
    goTo,
    baseUrl,
} from 'jezve-test';
import { IconButton } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { TilesList } from './component/Tiles/TilesList.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';
import { Counter } from './component/Counter.js';
import { AccountDetails } from './component/Account/AccountDetails.js';

const listMenuItems = [
    'selectModeBtn',
    'selectAllBtn',
    'deselectAllBtn',
    'exportBtn',
    'showBtn',
    'hideBtn',
    'deleteBtn',
];

const contextMenuItems = [
    'ctxDetailsBtn',
    'ctxUpdateBtn',
    'ctxExportBtn',
    'ctxShowBtn',
    'ctxHideBtn',
    'ctxDeleteBtn',
];

/** List of accounts view class */
export class AccountListView extends AppView {
    async parseContent() {
        const res = {
            addBtn: await IconButton.create(this, await query('#createBtn')),
            listModeBtn: await IconButton.create(this, await query('#listModeBtn')),
            listMenuContainer: {
                elem: await query('.heading-actions .popup-menu'),
                menuBtn: await query('.heading-actions .popup-menu-btn'),
            },
            listMenu: { elem: await query('#listMenu') },
            totalCounter: await Counter.create(this, await query('#itemsCounter')),
            hiddenCounter: await Counter.create(this, await query('#hiddenCounter')),
            selectedCounter: await Counter.create(this, await query('#selectedCounter')),
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of view: ${child} component not found`)
        ));

        await this.parseMenuItems(res, listMenuItems);

        // Context menu
        res.contextMenu = { elem: await query('#contextMenu') };
        const contextParent = await closest(res.contextMenu.elem, '.tile');
        if (contextParent) {
            const itemId = await prop(contextParent, 'dataset.id');
            res.contextMenu.tileId = parseInt(itemId, 10);
            assert(res.contextMenu.tileId, 'Invalid account');

            await this.parseMenuItems(res, contextMenuItems);
        }

        res.tiles = await TilesList.create(this, await query('#contentContainer .tiles:first-child'));
        res.hiddenTiles = await TilesList.create(this, await query('#hiddenTilesHeading + .tiles'));
        res.loadingIndicator = { elem: await query('#contentContainer .loading-indicator') };
        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        res.itemInfo = await AccountDetails.create(this, await query('#itemInfo .list-item-details'));

        res.renderTime = await prop(res.tiles.elem, 'dataset.time');

        return res;
    }

    async parseMenuItems(cont, ids) {
        const itemIds = asArray(ids);
        if (!itemIds.length) {
            return cont;
        }

        const res = cont;
        await asyncMap(itemIds, async (id) => {
            res[id] = await IconButton.create(this, await query(`#${id}`));
            assert(res[id], `Menu item '${id}' not found`);
            return res[id];
        });

        return res;
    }

    getViewMode(cont) {
        if (!cont.listMenuContainer.visible) {
            return 'nodata';
        }

        if (!cont.addBtn.content.visible) {
            return 'select';
        }

        return 'list';
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            tiles: cont.tiles.getItems(),
            hiddenTiles: cont.hiddenTiles.getItems(),
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            contextItem: cont.contextMenu.tileId,
            mode: this.getViewMode(cont),
            listMenuVisible: cont.listMenu.visible,
            contextMenuVisible: cont.contextMenu.visible,
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
        const itemsCount = model.tiles.length + model.hiddenTiles.length;
        const visibleSelected = this.getSelectedItems(model);
        const hiddenSelected = this.getHiddenSelectedItems(model);
        const totalSelected = visibleSelected.length + hiddenSelected.length;
        const isListMode = model.mode === 'list';
        const showSelectItems = model.listMenuVisible && model.mode === 'select';

        const res = {
            header: {
                localeSelect: { value: model.locale },
            },
            addBtn: { visible: isListMode },
            listModeBtn: { visible: !isListMode },
            loadingIndicator: { visible: model.loading },
            totalCounter: { visible: true, value: itemsCount },
            hiddenCounter: { visible: true, value: model.hiddenTiles.length },
            selectedCounter: { visible: model.mode === 'select', value: totalSelected },
            listMenuContainer: { visible: itemsCount > 0 },
            listMenu: { visible: model.listMenuVisible },
            selectModeBtn: { visible: model.listMenuVisible && isListMode },
            selectAllBtn: {
                visible: showSelectItems && itemsCount > 0 && totalSelected < itemsCount,
            },
            deselectAllBtn: {
                visible: showSelectItems && itemsCount > 0 && totalSelected > 0,
            },
            exportBtn: { visible: showSelectItems && (totalSelected > 0) },
            showBtn: { visible: showSelectItems && (hiddenSelected.length > 0) },
            hideBtn: { visible: showSelectItems && (visibleSelected.length > 0) },
            deleteBtn: { visible: showSelectItems && (totalSelected > 0) },
        };

        if (model.detailsItem) {
            res.itemInfo = AccountDetails.render(model.detailsItem, App.state);
            res.itemInfo.visible = true;
        }

        if (model.contextMenuVisible) {
            const ctxAccount = App.state.accounts.getItem(model.contextItem);
            assert(ctxAccount, 'Invalid state');

            const isHidden = App.state.accounts.isHidden(ctxAccount);
            res.contextMenu = {
                visible: true,
                tileId: model.contextItem,
            };

            res.ctxDetailsBtn = { visible: true };
            res.ctxUpdateBtn = { visible: true };
            res.ctxExportBtn = { visible: true };
            res.ctxShowBtn = { visible: isHidden };
            res.ctxHideBtn = { visible: !isHidden };
            res.ctxDeleteBtn = { visible: true };
        }

        return res;
    }

    getSelectedItems(model = this.model) {
        return model.tiles.filter((item) => item.isActive);
    }

    getHiddenSelectedItems(model = this.model) {
        return model.hiddenTiles.filter((item) => item.isActive);
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
            await this.performAction(() => this.content.ctxDetailsBtn.click());
        }

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

        await navigation(() => this.content.ctxUpdateBtn.click());
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
        await this.cancelSelectMode();

        const item = this.getItemByIndex(num);

        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.getExpectedState();

        const tile = this.getTileByIndex(num);
        await this.performAction(() => tile.click());

        return this.checkState(expected);
    }

    async openListMenu() {
        assert(!this.content.listMenu.visible, 'List menu already opened');

        this.model.listMenuVisible = true;
        const expected = this.getExpectedState();

        await this.performAction(() => click(this.content.listMenuContainer.menuBtn));

        return this.checkState(expected);
    }

    async toggleSelectMode() {
        const isListMode = (this.model.mode === 'list');
        if (isListMode) {
            await this.openListMenu();
        }

        this.model.listMenuVisible = false;
        this.model.mode = (isListMode) ? 'select' : 'list';
        this.onDeselectAll();
        const expected = this.getExpectedState();

        const buttonName = (isListMode) ? 'selectModeBtn' : 'listModeBtn';
        await this.performAction(() => this.content[buttonName].click());

        return this.checkState(expected);
    }

    async setSelectMode() {
        if (this.model.mode === 'select') {
            return true;
        }

        return this.toggleSelectMode();
    }

    async cancelSelectMode() {
        if (this.model.mode === 'list') {
            return true;
        }

        return this.toggleSelectMode();
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

        await this.performAction(() => this.content.selectAllBtn.click());

        return this.checkState(expected);
    }

    async deselectAll() {
        assert(this.model.mode === 'select', 'Invalid state');

        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.onDeselectAll();
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deselectAllBtn.click());

        return this.checkState(expected);
    }

    /** Delete secified accounts and return navigation promise */
    async deleteAccounts(data) {
        await this.selectAccounts(data);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deleteBtn.click());
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete account warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }

    /** Show secified accounts */
    async showAccounts(acc, val = true) {
        await this.selectAccounts(acc);

        await this.openListMenu();

        if (val) {
            await this.waitForList(() => this.content.showBtn.click());
        } else {
            await this.waitForList(() => this.content.hideBtn.click());
        }
    }

    /** Hide secified accounts and return navigation promise */
    async hideAccounts(acc) {
        await this.showAccounts(acc, false);
    }

    /** Export transactions of specified accounts */
    async exportAccounts(acc) {
        await this.selectAccounts(acc);

        const downloadURL = this.content.exportBtn.link;
        assert(downloadURL, 'Invalid export URL');

        const exportResp = await httpReq('GET', downloadURL);
        assert(exportResp?.status === 200, 'Invalid response');

        await this.cancelSelectMode();

        return exportResp.body;
    }

    static render(state) {
        const userAccounts = state.accounts.getUserAccounts();

        const res = {
            tiles: TilesList.renderAccounts(userAccounts),
            hiddenTiles: TilesList.renderHiddenAccounts(userAccounts),
        };

        return res;
    }
}
