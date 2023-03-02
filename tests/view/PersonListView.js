import {
    asArray,
    assert,
    asyncMap,
    query,
    prop,
    navigation,
    waitForFunction,
    click,
    baseUrl,
    goTo,
    wait,
    evaluate,
    httpReq,
} from 'jezve-test';
import { Button } from 'jezvejs-test';
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

const modeButtons = {
    list: 'listModeBtn',
    select: 'selectModeBtn',
    sort: 'sortModeBtn',
};

const listMenuSelector = '#listMenu';
const listMenuItems = [
    'selectModeBtn',
    'sortModeBtn',
    'sortByNameBtn',
    'sortByDateBtn',
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

/** List of persons view class */
export class PersonListView extends AppView {
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
        res.listMenu = { elem: await query(listMenuSelector) };
        if (res.listMenu.elem) {
            await this.parseMenuItems(res, listMenuItems);
        }

        // Context menu
        res.contextMenu = { elem: await query('#contextMenu') };
        res.contextMenu.itemId = await evaluate((menuEl) => (
            menuEl?.previousElementSibling?.classList.contains('tile')
                ? parseInt(menuEl.previousElementSibling.dataset.id, 10)
                : null
        ), res.contextMenu.elem);

        if (res.contextMenu.itemId) {
            await this.parseMenuItems(res, contextMenuItems);
        }

        res.tiles = await TilesList.create(this, await query('#contentContainer .tiles:first-child'));
        res.hiddenTiles = await TilesList.create(this, await query('#hiddenTilesHeading + .tiles'));
        res.loadingIndicator = { elem: await query('#contentContainer .loading-indicator') };
        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        res.itemInfo = await PersonDetails.create(this, await query('#itemInfo .list-item-details'));

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
            res[id] = await Button.create(this, await query(`#${id}`));
            assert(res[id], `Menu item '${id}' not found`);
            return res[id];
        });

        return res;
    }

    buildModel(cont) {
        const contextMenuVisible = cont.contextMenu.visible;
        const res = {
            locale: cont.locale,
            tiles: cont.tiles.getItems(),
            hiddenTiles: cont.hiddenTiles.getItems(),
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            contextItem: cont.contextMenu.itemId,
            mode: cont.tiles.listMode,
            sortMode: App.state.getPersonsSortMode(),
            listMenuVisible: cont.listMenu.visible,
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
        const itemsCount = model.tiles.length + model.hiddenTiles.length;
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
            menuBtn: { visible: itemsCount > 0 && !isSortMode },
            listMenu: { visible: model.listMenuVisible },
        };

        if (model.detailsItem) {
            res.itemInfo = PersonDetails.render(model.detailsItem, App.state);
            res.itemInfo.visible = true;
        }

        if (model.listMenuVisible) {
            res.selectModeBtn = { visible: model.listMenuVisible && isListMode && itemsCount > 0 };
            res.sortModeBtn = { visible: showSortItems };
            res.sortByNameBtn = { visible: showSortItems };
            res.sortByDateBtn = { visible: showSortItems };
            res.selectAllBtn = {
                visible: showSelectItems && totalSelected < itemsCount,
            };
            res.deselectAllBtn = {
                visible: showSelectItems && totalSelected > 0,
            };
            res.exportBtn = { visible: showSelectItems && (totalSelected > 0) };
            res.showBtn = { visible: showSelectItems && hiddenSelected.length > 0 };
            res.hideBtn = { visible: showSelectItems && visibleSelected.length > 0 };
            res.deleteBtn = { visible: showSelectItems && totalSelected > 0 };
        }

        if (model.contextMenuVisible) {
            const ctxPerson = App.state.persons.getItem(model.contextItem);
            assert(ctxPerson, 'Invalid state');

            const isHidden = App.state.persons.isHidden(ctxPerson);
            res.contextMenu = {
                visible: true,
                itemId: model.contextItem,
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
            await this.performAction(() => this.content.ctxDetailsBtn.click());
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
        assert(!this.content.listMenu.visible, 'List menu already opened');

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
        assert(this.content.listMenu.visible, 'List menu not opened');

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

        const buttonName = modeButtons[listMode];
        const button = this.content[buttonName];
        assert(button, `Button ${buttonName} not found`);

        if (listMode === 'sort') {
            await this.waitForList(() => button.click());
        } else {
            await this.performAction(() => button.click());
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

        const expList = PersonListView.render(App.state);
        const expected = this.getExpectedState();
        Object.assign(expected, expList);

        const button = this.content.sortByNameBtn;
        assert(button, 'Sort by name button not found');

        await this.waitForList(() => button.click());

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

        const expList = PersonListView.render(App.state);
        const expected = this.getExpectedState();
        Object.assign(expected, expList);

        const button = this.content.sortByDateBtn;
        assert(button, 'Sort by date button not found');

        await this.waitForList(() => button.click());

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

            const tile = this.getTileByIndex(num);
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

        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.onDeselectAll();
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deselectAllBtn.click());

        return this.checkState(expected);
    }

    async deletePersons(persons) {
        await this.selectPersons(persons);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deleteBtn.click());
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete person(s) warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }

    /** Show secified persons */
    async showPersons(persons, val = true) {
        await this.selectPersons(persons);

        await this.openListMenu();

        if (val) {
            await this.waitForList(() => this.content.showBtn.click());
        } else {
            await this.waitForList(() => this.content.hideBtn.click());
        }
    }

    /** Hide specified persons */
    async hidePersons(persons) {
        await this.showPersons(persons, false);
    }

    /** Export transactions of specified persons */
    async exportPersons(persons) {
        await this.selectPersons(persons);
        await this.openListMenu();

        const downloadURL = this.content.exportBtn.link;
        assert(downloadURL, 'Invalid export URL');

        const exportResp = await httpReq('GET', downloadURL);
        assert(exportResp?.status === 200, 'Invalid response');

        await this.closeListMenu();

        return exportResp.body;
    }

    static render(state) {
        const visiblePersons = state.persons.getVisible(true);
        const hiddenPersons = state.persons.getHidden(true);

        const sortMode = state.profile.settings.sort_persons;
        const res = {
            tiles: TilesList.renderPersons(state.persons, false, sortMode),
            hiddenTiles: TilesList.renderHiddenPersons(state.persons, false, sortMode),
        };
        res.tiles.visible = true;
        res.tiles.noDataMsg = {
            visible: visiblePersons.length === 0,
        };
        res.hiddenTiles.visible = hiddenPersons.length > 0;

        return res;
    }
}
