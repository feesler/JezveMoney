import {
    asArray,
    assert,
    query,
    prop,
    navigation,
    waitForFunction,
    click,
    baseUrl,
    goTo,
    wait,
    evaluate,
} from 'jezve-test';
import { Button, PopupMenu } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { TilesList } from './component/Tiles/TilesList.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';
import { Counter } from './component/Counter.js';
import { PersonDetails } from './component/Person/PersonDetails.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC, SORT_BY_NAME_DESC,
    SORT_MANUALLY,
} from '../common.js';
import { ExportDialog } from './component/ExportDialog.js';

const listMenuSelector = '#listMenu';
const exportDialogSelector = '.export-dialog';

/** List of persons view class */
export class PersonListView extends AppView {
    static getExpectedState(model, state = App.state) {
        const sortMode = state.getPersonsSortMode();
        const itemsCount = state.persons.length;
        const visibleSelected = this.getSelectedItems(model);
        const hiddenSelected = this.getHiddenSelectedItems(model);
        const totalSelected = visibleSelected.length + hiddenSelected.length;
        const isListMode = model.mode === 'list';
        const isSortMode = model.mode === 'sort';
        const showSortItems = model.listMenuVisible && isListMode && itemsCount > 1;

        const showSelectItems = (
            itemsCount > 0
            && model.listMenuVisible
            && model.mode === 'select'
        );

        const visiblePersons = state.persons.getVisible(true);
        const hiddenPersons = state.persons.getHidden(true);

        const tiles = TilesList.renderPersons(state.persons, false, sortMode);
        const hiddenTiles = TilesList.renderHiddenPersons(state.persons, false, sortMode);

        const res = {
            header: this.getHeaderExpectedState(state),
            addBtn: { visible: isListMode },
            listModeBtn: { visible: !isListMode },
            loadingIndicator: { visible: model.loading },
            totalCounter: { visible: true, value: itemsCount },
            hiddenCounter: { visible: true, value: hiddenPersons.length },
            selectedCounter: { visible: model.mode === 'select', value: totalSelected },
            menuBtn: { visible: itemsCount > 0 && !isSortMode },
            tiles,
            hiddenTiles,
        };

        res.tiles.visible = true;
        res.tiles.noDataMsg = {
            visible: visiblePersons.length === 0,
        };
        res.hiddenTiles.visible = hiddenPersons.length > 0;

        if (model.detailsItem) {
            res.itemInfo = PersonDetails.getExpectedState(model.detailsItem, state);
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
            const ctxPerson = state.persons.getItem(model.contextItem);
            assert(ctxPerson, 'Invalid state');

            const isHidden = state.persons.isHidden(ctxPerson);

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

        return this.getExpectedState(model, state);
    }

    get listMenu() {
        return this.content.listMenu;
    }

    get contextMenu() {
        return this.content.contextMenu;
    }

    get exportDialog() {
        return this.content.exportDialog;
    }

    async parseContent() {
        const res = {
            addBtn: await Button.create(this, await query('#createBtn')),
            listModeBtn: await Button.create(this, await query('#listModeBtn')),
            menuBtn: { elem: await query('.heading-actions .menu-btn') },
            totalCounter: await Counter.create(this, await query('.items-counter')),
            hiddenCounter: await Counter.create(this, await query('.hidden-counter')),
            selectedCounter: await Counter.create(this, await query('.selected-counter')),
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

        res.itemInfo = await PersonDetails.create(this, await query('#itemInfo .list-item-details'));

        // Export dialog
        const exportDialogVisible = await evaluate((selector) => {
            const dialogEl = document.querySelector(selector);
            return dialogEl && !dialogEl.hidden;
        }, exportDialogSelector);
        if (exportDialogVisible) {
            res.exportDialog = await ExportDialog.create(this, await query(exportDialogSelector));
        }

        res.renderTime = await prop(res.tiles.elem, 'dataset.time');

        return res;
    }

    buildModel(cont) {
        const contextMenuVisible = cont.contextMenu?.visible;
        const res = {
            locale: cont.locale,
            tiles: cont.tiles.getItems(),
            hiddenTiles: cont.hiddenTiles.getItems(),
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            contextItem: cont.contextMenu?.itemId,
            mode: cont.tiles.listMode,
            sortMode: App.state.getPersonsSortMode(),
            listMenuVisible: cont.listMenu?.visible,
            contextMenuVisible,
            detailsItem: this.getDetailsItem(this.getDetailsId()),
        };

        return res;
    }

    getDetailsId() {
        const viewPath = '/persons/';
        const { pathname } = new URL(this.location);
        assert(pathname.startsWith(viewPath), `Invalid location path: ${pathname}`);

        if (pathname.length === viewPath.length) {
            return 0;
        }

        const param = pathname.substring(viewPath.length);
        return parseInt(param, 10) ?? 0;
    }

    getDetailsItem(itemId) {
        return App.state.persons.getItem(itemId);
    }

    getExpectedURL(model = this.model) {
        let res = `${baseUrl()}persons/`;

        if (model.detailsItem) {
            res += model.detailsItem.id.toString();
        }

        return res;
    }

    getExpectedState(model = this.model) {
        return PersonListView.getExpectedState(model);
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

    /** Click on add button */
    async goToCreatePerson() {
        await navigation(() => this.content.addBtn.click());
    }

    /** Clicks by 'Show details' context menu item of specified person */
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

    /** Select specified person, click on edit button */
    async goToUpdatePerson(num) {
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
            return wait('[data-id="ctxDeleteBtn"]', { visible: true });
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
                sort_persons: this.model.sortMode,
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
            sort_persons: this.model.sortMode,
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
            sort_persons: this.model.sortMode,
        });

        const expected = this.getExpectedState();

        await this.waitForList(() => this.listMenu.select('sortByDateBtn'));

        return this.checkState(expected);
    }

    async selectPersons(data) {
        assert.isDefined(data, 'No persons specified');

        await this.setSelectMode();

        const persons = asArray(data);
        for (const num of persons) {
            const item = this.getItemByIndex(num);
            item.isActive = !item.isActive;

            const expected = this.getExpectedState();

            await this.waitForList(() => this.getTileByIndex(num).click());

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

    /** Delete secified person from context menu */
    async deleteFromContextMenu(index) {
        await this.openContextMenu(index);

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        const expected = this.getExpectedState();

        await this.performAction(() => this.contextMenu.select('ctxDeleteBtn'));

        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete person warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }

    async deletePersons(persons) {
        await this.selectPersons(persons);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('deleteBtn'));
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete person(s) warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }

    /** Show secified persons */
    async showPersons(persons, val = true) {
        await this.selectPersons(persons);

        await this.openListMenu();

        await this.waitForList(() => (
            this.listMenu.select((val) ? 'showBtn' : 'hideBtn')
        ));
    }

    /** Hide specified persons */
    async hidePersons(persons) {
        await this.showPersons(persons, false);
    }

    /** Export transactions of specified persons */
    async exportPersons(persons) {
        await this.selectPersons(persons);
        await this.openListMenu();

        await this.performAction(() => this.listMenu.select('exportBtn'));
        await this.performAction(() => wait(exportDialogSelector, { visible: true }));

        const res = await this.exportDialog.download();

        await this.performAction(() => this.exportDialog.close());
        await this.setListMode();

        return res;
    }
}
