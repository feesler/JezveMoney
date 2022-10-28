import {
    assert,
    query,
    prop,
    navigation,
    waitForFunction,
    click,
    httpReq,
    parentNode,
    asArray,
    asyncMap,
} from 'jezve-test';
import { AppView } from './AppView.js';
import { TilesList } from './component/TilesList.js';
import { IconButton } from './component/IconButton.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';

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
    'ctxUpdateBtn', 'ctxExportBtn', 'ctxShowBtn', 'ctxHideBtn', 'ctxDeleteBtn',
];

/** List of accounts view class */
export class AccountListView extends AppView {
    async parseContent() {
        const res = {
            titleEl: await query('.content_wrap > .heading > h1'),
            addBtn: await IconButton.create(this, await query('#add_btn')),
            listMenuContainer: {
                elem: await query('#listMenu'),
                menuBtn: await query('#listMenu .actions-menu-btn'),
            },
            listMenu: { elem: await query('#listMenu .actions-menu-list') },
            contextMenu: { elem: await query('#contextMenu') },
        };

        await this.parseMenuItems(res, listMenuItems);

        assert(
            res.titleEl
            && res.addBtn
            && res.listMenuContainer.elem
            && res.listMenuContainer.menuBtn
            && res.listMenu.elem,
            'Invalid structure of accounts view',
        );

        if (res.contextMenu.elem) {
            const contextParent = await parentNode(res.contextMenu.elem);
            const itemId = await prop(contextParent, 'dataset.id');
            res.contextMenu.tileId = parseInt(itemId, 10);
            assert(res.contextMenu.tileId, 'Invalid account');

            await this.parseMenuItems(res, contextMenuItems);
        }

        res.title = await prop(res.titleEl, 'textContent');
        res.tiles = await TilesList.create(this, await query('#tilesContainer'));
        res.hiddenTiles = await TilesList.create(this, await query('#hiddenTilesContainer'));
        res.loadingIndicator = { elem: await query('.loading-indicator') };
        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

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

        if (cont.selectModeBtn.title === 'Cancel') {
            return 'select';
        }

        return 'list';
    }

    async buildModel(cont) {
        const res = {
            tiles: cont.tiles.getItems(),
            hiddenTiles: cont.hiddenTiles.getItems(),
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            contextItem: cont.contextMenu.tileId,
            mode: this.getViewMode(cont),
            listMenuVisible: cont.listMenu.visible,
            contextMenuVisible: cont.contextMenu.visible,
        };

        return res;
    }

    getExpectedState(model = this.model) {
        const itemsCount = model.tiles.length + model.hiddenTiles.length;
        const visibleSelected = this.getSelectedItems(model);
        const hiddenSelected = this.getHiddenSelectedItems(model);
        const totalSelected = visibleSelected.length + hiddenSelected.length;

        const showSelectItems = model.listMenuVisible && model.mode === 'select';

        const res = {
            loadingIndicator: { visible: model.loading },
            listMenu: { visible: model.listMenuVisible },
            selectModeBtn: { visible: model.listMenuVisible },
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

        if (model.contextMenuVisible) {
            const ctxAccount = App.state.accounts.getItem(model.contextItem);
            assert(ctxAccount, 'Invalid state');

            const isHidden = App.state.accounts.isHidden(ctxAccount);
            res.contextMenu = {
                visible: true,
                tileId: model.contextItem,
            };

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

    getItems() {
        const visibleItems = this.content.tiles.getItems();
        const hiddenItems = this.content.hiddenTiles.getItems();

        return visibleItems.concat(hiddenItems);
    }

    /** Click on add button and return navigation promise */
    async goToCreateAccount() {
        await navigation(() => this.content.addBtn.click());
    }

    /** Select specified account, click on edit button and return navigation promise */
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

    async openContextMenu(num) {
        await this.cancelSelectMode();

        const visibleTiles = this.model.tiles.length;
        const hiddenTiles = this.model.hiddenTiles.length;
        const totalTiles = visibleTiles + hiddenTiles;

        assert(num >= 0 && num < totalTiles, 'Invalid account number');

        const item = (num < visibleTiles)
            ? this.model.tiles[num]
            : this.model.hiddenTiles[num - visibleTiles];

        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.getExpectedState();

        const tile = (num < visibleTiles)
            ? this.content.tiles.content.items[num]
            : this.content.hiddenTiles.content.items[num - visibleTiles];

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
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.mode = (this.model.mode === 'select') ? 'list' : 'select';
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.selectModeBtn.click());

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

        const accounts = Array.isArray(data) ? data : [data];

        const visibleTiles = this.model.tiles.length;
        const hiddenTiles = this.model.hiddenTiles.length;
        const totalTiles = visibleTiles + hiddenTiles;
        for (const num of accounts) {
            assert(num >= 0 && num < totalTiles, 'Invalid account number');

            const item = (num < visibleTiles)
                ? this.model.tiles[num]
                : this.model.hiddenTiles[num - visibleTiles];

            item.isActive = !item.isActive;

            const expected = this.getExpectedState();

            const tile = (num < visibleTiles)
                ? this.content.tiles.content.items[num]
                : this.content.hiddenTiles.content.items[num - visibleTiles];

            await this.waitForList(() => tile.click());

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

        const deselectItem = (item) => ({ ...item, isActive: false });

        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.tiles = this.model.tiles.map(deselectItem);
        this.model.hiddenTiles = this.model.hiddenTiles.map(deselectItem);
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
        assert(this.content.delete_warning.content.okBtn, 'OK button not found');

        await this.waitForList(() => click(this.content.delete_warning.content.okBtn));
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