import {
    asArray,
    assert,
    asyncMap,
    query,
    prop,
    parentNode,
    navigation,
    waitForFunction,
    click,
} from 'jezve-test';
import { AppView } from './AppView.js';
import { TilesList } from './component/TilesList.js';
import { IconButton } from './component/IconButton.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';

const listMenuItems = [
    'selectModeBtn', 'showBtn', 'hideBtn', 'deleteBtn',
];

const contextMenuItems = [
    'ctxUpdateBtn', 'ctxShowBtn', 'ctxHideBtn', 'ctxDeleteBtn',
];

/** List of persons view class */
export class PersonListView extends AppView {
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
            'Invalid structure of persons view',
        );

        if (res.contextMenu.elem) {
            const contextParent = await parentNode(res.contextMenu.elem);
            const itemId = await prop(contextParent, 'dataset.id');
            res.contextMenu.tileId = parseInt(itemId, 10);
            assert(res.contextMenu.tileId, 'Invalid person');

            await this.parseMenuItems(res, contextMenuItems);
        }

        res.title = prop(res.titleEl, 'textContent');
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
        const contextMenuVisible = cont.contextMenu.visible;
        const res = {
            tiles: cont.tiles.getItems(),
            hiddenTiles: cont.hiddenTiles.getItems(),
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
        const visibleSelected = this.getSelectedItems(model);
        const hiddenSelected = this.getHiddenSelectedItems(model);
        const totalSelected = visibleSelected.length + hiddenSelected.length;

        const showSelectItems = model.listMenuVisible && model.mode === 'select';

        const res = {
            loadingIndicator: { visible: model.loading },
            listMenu: { visible: model.listMenuVisible },
            selectModeBtn: { visible: model.listMenuVisible },
            showBtn: { visible: showSelectItems && (hiddenSelected.length > 0) },
            hideBtn: { visible: showSelectItems && (visibleSelected.length > 0) },
            deleteBtn: { visible: showSelectItems && (totalSelected > 0) },
        };

        if (model.contextMenuVisible) {
            const ctxPerson = App.state.persons.getItem(model.contextItem);
            assert(ctxPerson, 'Invalid state');

            const isHidden = App.state.persons.isHidden(ctxPerson);
            res.contextMenu = {
                visible: true,
                tileId: model.contextItem,
            };

            res.ctxUpdateBtn = { visible: true };
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

    /** Click on add button */
    async goToCreatePerson() {
        await navigation(() => this.content.addBtn.click());
    }

    /** Select specified person, click on edit button */
    async goToUpdatePerson(num) {
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

        assert(num >= 0 && num < totalTiles, 'Invalid person number');

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

    async selectPersons(data) {
        assert.isDefined(data, 'No persons specified');

        await this.setSelectMode();

        const persons = Array.isArray(data) ? data : [data];

        const visibleTiles = this.model.tiles.length;
        const hiddenTiles = this.model.hiddenTiles.length;
        const totalTiles = visibleTiles + hiddenTiles;
        for (const num of persons) {
            assert(num >= 0 && num < totalTiles, 'Invalid person number');

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

    async deletePersons(persons) {
        await this.selectPersons(persons);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deleteBtn.click());
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete person(s) warning popup not appear');

        await this.waitForList(() => click(this.content.delete_warning.content.okBtn));
    }

    /** Show secified accounts */
    async showPersons(persons, val = true) {
        await this.selectPersons(persons);

        await this.openListMenu();

        if (val) {
            await this.waitForList(() => this.content.showBtn.click());
        } else {
            await this.waitForList(() => this.content.hideBtn.click());
        }
    }

    /** Hide secified accounts */
    async hidePersons(persons) {
        await this.showPersons(persons, false);
    }

    static render(state) {
        const res = {
            tiles: TilesList.renderPersons(state.persons, false),
            hiddenTiles: TilesList.renderHiddenPersons(state.persons),
        };

        return res;
    }
}
