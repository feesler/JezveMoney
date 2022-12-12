import {
    asArray,
    assert,
    asyncMap,
    query,
    prop,
    closest,
    navigation,
    waitForFunction,
    click,
} from 'jezve-test';
import { IconButton } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { TilesList } from './component/TilesList.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';
import { Counter } from './component/Counter.js';

const listMenuItems = [
    'selectModeBtn',
    'selectAllBtn',
    'deselectAllBtn',
    'deleteBtn',
];

const contextMenuItems = [
    'ctxUpdateBtn', 'ctxDeleteBtn',
];

/** List of categories view class */
export class CategoryListView extends AppView {
    async parseContent() {
        const res = {
            title: { elem: await query('.content_wrap > .heading > h1') },
            addBtn: await IconButton.create(this, await query('#add_btn')),
            listModeBtn: await IconButton.create(this, await query('#listModeBtn')),
            listMenuContainer: {
                elem: await query('.heading-actions .popup-menu'),
                menuBtn: await query('.heading-actions .popup-menu-btn'),
            },
            listMenu: { elem: await query('#listMenu') },
            totalCounter: await Counter.create(this, await query('#itemsCounter')),
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
            assert(res.contextMenu.tileId, 'Invalid category');

            await this.parseMenuItems(res, contextMenuItems);
        }

        res.title.value = prop(res.title.elem, 'textContent');
        res.tiles = await TilesList.create(this, await query('.content-header + .tiles'));
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

        if (!cont.addBtn.content.visible) {
            return 'select';
        }

        return 'list';
    }

    async buildModel(cont) {
        const contextMenuVisible = cont.contextMenu.visible;
        const res = {
            tiles: cont.tiles.getItems(),
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            contextItem: cont.contextMenu.tileId,
            mode: this.getViewMode(cont),
            listMenuVisible: cont.listMenu.visible,
            contextMenuVisible,
        };

        return res;
    }

    getExpectedState(model = this.model) {
        const itemsCount = model.tiles.length;
        const selectedItems = this.getSelectedItems(model);
        const totalSelected = selectedItems.length;
        const isListMode = model.mode === 'list';

        const showSelectItems = (
            itemsCount > 0
            && model.listMenuVisible
            && model.mode === 'select'
        );

        const res = {
            addBtn: { visible: isListMode },
            listModeBtn: { visible: !isListMode },
            loadingIndicator: { visible: model.loading },
            totalCounter: { visible: true, value: itemsCount },
            selectedCounter: { visible: model.mode === 'select', value: totalSelected },
            listMenuContainer: { visible: itemsCount > 0 },
            listMenu: { visible: model.listMenuVisible },
            selectModeBtn: { visible: model.listMenuVisible && isListMode },
            selectAllBtn: {
                visible: showSelectItems && totalSelected < itemsCount,
            },
            deselectAllBtn: {
                visible: showSelectItems && totalSelected > 0,
            },
            deleteBtn: { visible: showSelectItems && totalSelected > 0 },
        };

        if (model.contextMenuVisible) {
            const ctxCategory = App.state.categories.getItem(model.contextItem);
            assert(ctxCategory, 'Invalid state');

            res.contextMenu = {
                visible: true,
                tileId: model.contextItem,
            };

            res.ctxUpdateBtn = { visible: true };
            res.ctxDeleteBtn = { visible: true };
        }

        return res;
    }

    getSelectedItems(model = this.model) {
        return model.tiles.filter((item) => item.isActive);
    }

    onDeselectAll() {
        this.model.tiles = this.model.tiles.map((item) => ({ ...item, isActive: false }));
    }

    getItems() {
        return this.content.tiles.getItems();
    }

    /** Click on add button */
    async goToCreateCategory() {
        await navigation(() => this.content.addBtn.click());
    }

    /** Select specified category, click on edit button */
    async goToUpdateCategory(num) {
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

        const totalTiles = this.model.tiles.length;
        assert(num >= 0 && num < totalTiles, 'Invalid category number');

        const item = this.model.tiles[num];

        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.getExpectedState();

        const tile = this.content.tiles.items[num];

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

    async selectCategories(data) {
        assert.isDefined(data, 'No categories specified');

        await this.setSelectMode();

        const indexes = asArray(data);
        for (const num of indexes) {
            assert.arrayIndex(this.model.tiles, num, 'Invalid category number');

            const item = this.model.tiles[num];
            item.isActive = !item.isActive;

            const expected = this.getExpectedState();

            const tile = this.content.tiles.items[num];
            await this.waitForList(() => tile.click());

            this.checkState(expected);
        }

        return true;
    }

    async selectAll() {
        await this.setSelectMode();
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.tiles = this.model.tiles.map((item) => ({ ...item, isActive: true }));
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

    async deleteCategories(categories) {
        await this.selectCategories(categories);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deleteBtn.click());
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete categories warning popup not appear');

        await this.waitForList(() => click(this.content.delete_warning.content.okBtn));
    }

    static render(state) {
        const res = {
            tiles: TilesList.renderCategories(state.categories),
        };

        return res;
    }
}
