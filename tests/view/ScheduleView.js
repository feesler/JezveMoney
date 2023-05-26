import {
    assert,
    asArray,
    asyncMap,
    query,
    evaluate,
    navigation,
    click,
    waitForFunction,
    goTo,
    baseUrl,
    copyObject,
    wait,
    prop,
} from 'jezve-test';
import {
    Button,
} from 'jezvejs-test';
import { App } from '../Application.js';
import { AppView } from './AppView.js';
import { Counter } from './component/Counter.js';
import { WarningPopup } from './component/WarningPopup.js';
import { ScheduleItemDetails } from './component/Schedule/ScheduleItemDetails.js';
import { ScheduleList } from './component/Schedule/ScheduleList.js';

const modeButtons = {
    list: 'listModeBtn',
    select: 'selectModeBtn',
};

const listMenuSelector = '#listMenu';
const listMenuItems = [
    'selectModeBtn',
    'selectAllBtn',
    'deselectAllBtn',
    'deleteBtn',
];

const contextMenuItems = [
    'ctxDetailsBtn',
    'ctxUpdateBtn',
    'ctxDeleteBtn',
];

/** Scheduled transactions list view class */
export class ScheduleView extends AppView {
    async parseContent() {
        const res = {
            createBtn: await Button.create(this, await query('#createBtn')),
            listModeBtn: await Button.create(this, await query('#listModeBtn')),
            menuBtn: { elem: await query('.heading-actions .menu-btn') },
            totalCounter: await Counter.create(this, await query('#itemsCounter')),
            selectedCounter: await Counter.create(this, await query('#selectedCounter')),
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of view: ${child} component not found`)
        ));

        res.heading = { elem: await query('.heading > h1') };
        assert(res.heading.elem, 'Heading element not found');
        res.heading.text = await prop(res.heading.elem, 'textContent');

        // Main menu
        res.listMenu = { elem: await query(listMenuSelector) };
        if (res.listMenu.elem) {
            await this.parseMenuItems(res, listMenuItems);
        }

        // Context menu
        res.contextMenu = { elem: await query('#contextMenu') };
        res.contextMenu.itemId = await evaluate((menuEl) => {
            const contextParent = menuEl?.closest('.schedule-item');
            return (contextParent)
                ? parseInt(contextParent.dataset.id, 10)
                : null;
        }, res.contextMenu.elem);

        if (res.contextMenu.itemId) {
            await this.parseMenuItems(res, contextMenuItems);
        }

        const listContainer = await query('.list-container');
        assert(listContainer, 'List container not found');
        res.loadingIndicator = { elem: await query(listContainer, '.loading-indicator') };

        const scheduleList = await query('.schedule-list');
        assert(scheduleList, 'Schedule list element not found');
        res.scheduleList = await ScheduleList.create(this, scheduleList);

        res.itemInfo = await ScheduleItemDetails.create(
            this,
            await query('.schedule-item-details .list-item-details'),
        );

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

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
        const res = {
            locale: cont.locale,
            contextItem: cont.contextMenu.itemId,
            listMode: (cont.scheduleList) ? cont.scheduleList.listMode : 'list',
            listMenuVisible: cont.listMenu.visible,
            contextMenuVisible: cont.contextMenu.visible,
            data: App.state.schedule.clone(),
            detailsItem: this.getDetailsItem(this.getDetailsId()),
        };

        if (cont.scheduleList) {
            res.list = {
                page: 1,
                pages: 1,
                items: cont.scheduleList.getItems(),
                range: 1,
            };

            res.renderTime = cont.scheduleList.content.renderTime;
        } else {
            res.list = {
                page: 0,
                pages: 0,
                items: [],
                range: 1,
            };
        }

        if (cont.modeSelector?.link) {
            const modeURL = new URL(cont.modeSelector.link);
            res.detailsMode = !this.hasDetailsModeParam(modeURL);
        } else {
            const locURL = new URL(this.location);
            res.detailsMode = this.hasDetailsModeParam(locURL);
        }

        res.loading = cont.loadingIndicator.visible;

        return res;
    }

    hasDetailsModeParam(url) {
        return url?.searchParams?.get('mode') === 'details';
    }

    cloneModel(model) {
        const res = copyObject(model);

        res.data = model.data.clone();

        return res;
    }

    getItems() {
        return this.content.scheduleList.getItems();
    }

    getSelectedItems(model = this.model) {
        return model.list.items.filter((item) => item.selected);
    }

    updateTransactions() {
        this.model.data = App.state.schedule.clone();
    }

    currentPage(model = this.model) {
        return model.list.page + model.list.range - 1;
    }

    currentRange(model = this.model) {
        return model.list.range;
    }

    pagesCount(model = this.model) {
        return model.list.pages;
    }

    isFirstPage() {
        return !this.content.paginator || this.content.paginator.isFirstPage();
    }

    isLastPage() {
        return !this.content.paginator || this.content.paginator.isLastPage();
    }

    getDetailsId() {
        const viewPath = '/schedule/';
        const { pathname } = new URL(this.location);
        assert(pathname.startsWith(viewPath), `Invalid location path: ${pathname}`);

        if (pathname.length === viewPath.length) {
            return 0;
        }

        const param = pathname.substring(viewPath.length);
        return parseInt(param, 10) ?? 0;
    }

    getDetailsItem(itemId) {
        return App.state.schedule.getItem(itemId);
    }

    getDetailsURL(model = this.model) {
        let res = `${baseUrl()}schedule/`;

        if (model.detailsItem) {
            res += model.detailsItem.id.toString();
        }

        return res;
    }

    getExpectedURL(model = this.model) {
        const res = new URL(`${baseUrl()}schedule/`);
        const params = {};

        if (model.list.page !== 0) {
            params.page = model.list.page;
        }

        if (model.detailsMode) {
            params.mode = 'details';
        }

        Object.entries(params).forEach(([name, value]) => {
            if (Array.isArray(value)) {
                const arrProp = `${name}[]`;
                value.forEach((item) => res.searchParams.append(arrProp, item));
            } else {
                res.searchParams.set(name, value);
            }
        });

        return res.toString();
    }

    getExpectedList(model = this.model) {
        const items = model.data;
        return ScheduleList.render(items.data, App.state);
    }

    getExpectedState(model = this.model) {
        const listMode = model.listMode === 'list';
        const selectMode = model.listMode === 'select';
        const isItemsAvailable = (model.data.length > 0);
        const selected = this.getSelectedItems(model);
        const showSelectItems = (
            isItemsAvailable
            && model.listMenuVisible
            && selectMode
        );

        const list = this.getExpectedList(model);

        const res = {
            totalCounter: { visible: true, value: model.data.length },
            selectedCounter: { visible: selectMode, value: selected.length },
            scheduleList: {
                ...list,
                visible: true,
            },
            createBtn: { visible: listMode },
            listModeBtn: { visible: !listMode },
            menuBtn: { visible: isItemsAvailable },
            listMenu: { visible: model.listMenuVisible },
        };

        if (model.detailsItem) {
            res.itemInfo = ScheduleItemDetails.render(model.detailsItem, App.state);
            res.itemInfo.visible = true;
        }

        if (model.listMenuVisible) {
            res.selectModeBtn = {
                visible: model.listMenuVisible && listMode && isItemsAvailable,
            };
            res.selectAllBtn = {
                visible: showSelectItems && selected.length < model.list.items.length,
            };
            res.deselectAllBtn = {
                visible: showSelectItems && selected.length > 0,
            };
            res.deleteBtn = { visible: showSelectItems && selected.length > 0 };
        }

        res.contextMenu = {
            visible: model.contextMenuVisible,
        };

        if (model.contextMenuVisible) {
            const contextItem = model.data.getItem(model.contextItem);
            assert(contextItem, 'Context item not found');

            res.contextMenu.itemId = model.contextItem;

            res.ctxDetailsBtn = { visible: true };
            res.ctxUpdateBtn = { visible: true };
            res.ctxDeleteBtn = { visible: true };
        }

        return res;
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
        await this.setListMode();

        assert.arrayIndex(this.model.list.items, num, 'Invalid transaction index');

        const item = this.content.scheduleList.items[num];
        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            await item.clickMenu();
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
        if (this.model.listMode === listMode) {
            return true;
        }

        assert(
            this.model.listMode === 'list' || listMode === 'list',
            `Can't change list mode from ${this.model.listMode} to ${listMode}.`,
        );

        if (listMode !== 'list') {
            await this.openListMenu();
        }

        this.model.listMenuVisible = false;
        this.model.listMode = listMode;
        const expected = this.getExpectedState();

        const buttonName = modeButtons[listMode];
        const button = this.content[buttonName];
        assert(button, `Button ${buttonName} not found`);

        await this.performAction(() => button.click());

        return this.checkState(expected);
    }

    async setListMode() {
        return this.changeListMode('list');
    }

    async setSelectMode() {
        return this.changeListMode('select');
    }

    /** Click on add button */
    async goToCreateNewItem() {
        await navigation(() => this.content.createBtn.click());
    }

    async selectItems(data) {
        assert.isDefined(data, 'No transactions specified');
        assert(this.content.scheduleList, 'No transactions available to select');

        await this.setSelectMode();

        const transactions = asArray(data);
        for (const num of transactions) {
            assert.arrayIndex(this.content.scheduleList.items, num);

            const item = this.model.list.items[num];
            item.selected = !item.selected;
            const expected = this.getExpectedState();

            await this.performAction(() => this.content.scheduleList.items[num].click());

            this.checkState(expected);
        }
    }

    async selectAll() {
        const selectItem = (item) => ({ ...item, selected: true });

        await this.setSelectMode();
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.list.items = this.model.list.items.map(selectItem);
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.selectAllBtn.click());

        return this.checkState(expected);
    }

    async deselectAll() {
        assert(this.model.listMode === 'select', 'Invalid state');

        const deselectItem = (item) => ({ ...item, selected: false });

        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.list.items = this.model.list.items.map(deselectItem);
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deselectAllBtn.click());

        return this.checkState(expected);
    }

    /** Clicks by 'Show details' context menu item of specified transaction */
    async showDetails(num, directNavigate = false) {
        if (!directNavigate) {
            assert(!this.model.detailsItem, 'Details already opened');
            await this.openContextMenu(num);
        }

        const item = this.content.scheduleList.items[num];
        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        this.model.detailsItem = this.getDetailsItem(item.id);
        assert(this.model.detailsItem, 'Item not found');
        if (directNavigate) {
            this.model.detailsMode = false;
        }
        const expected = this.getExpectedState();

        if (directNavigate) {
            await goTo(this.getDetailsURL());
        } else {
            await this.performAction(() => this.content.ctxDetailsBtn.click());
        }

        return App.view.checkState(expected);
    }

    /** Closes item details */
    async closeDetails(directNavigate = false) {
        assert(this.model.detailsItem, 'Details already closed');

        this.model.detailsItem = null;
        if (directNavigate) {
            this.model.detailsMode = false;
        }
        const expected = this.getExpectedState();

        if (directNavigate) {
            await goTo(this.getDetailsURL());
        } else {
            await this.performAction(() => this.content.itemInfo.close());
        }

        return App.view.checkState(expected);
    }

    /** Opens context menu for specified item and clicks on 'update' item */
    async goToUpdateItem(num) {
        await this.openContextMenu(num);

        return navigation(() => this.content.ctxUpdateBtn.click());
    }

    /** Delete specified transaction from context menu */
    async deleteFromContextMenu(index) {
        await this.openContextMenu(index);

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.ctxDeleteBtn.click());

        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete item warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }

    /** Delete specified scheduled transactions */
    async deleteItems(data) {
        assert(data, 'No transactions specified');

        const items = asArray(data);
        await this.selectItems(items);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deleteBtn.click());
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete item warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }
}
