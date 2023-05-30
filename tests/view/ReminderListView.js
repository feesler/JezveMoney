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
    Button, Paginator,
} from 'jezvejs-test';
import { App } from '../Application.js';
import { __ } from '../model/locale.js';
import { RemindersList } from '../model/RemindersList.js';
import { AppView } from './AppView.js';
import { Counter } from './component/Counter.js';
import { ReminderDetails } from './component/Reminder/ReminderDetails.js';
import { TransactionRemindersList } from './component/Reminder/TransactionRemindersList.js';
import { REMINDER_SCHEDULED } from '../model/Reminder.js';

const modeButtons = {
    list: 'listModeBtn',
    select: 'selectModeBtn',
};

const listMenuSelector = '#listMenu';
const listMenuItems = [
    'selectModeBtn',
    'selectAllBtn',
    'deselectAllBtn',
    'confirmBtn',
    'cancelBtn',
];

const contextMenuItems = [
    'ctxDetailsBtn',
    'ctxConfirmBtn',
    'ctxUpdateBtn',
    'ctxCancelBtn',
];

/** Scheduled transactions list view class */
export class ReminderListView extends AppView {
    constructor(...args) {
        super(...args);

        this.items = null;
    }

    async parseContent() {
        const res = {
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
            const contextParent = menuEl?.closest('.reminder-item');
            return (contextParent)
                ? parseInt(contextParent.dataset.id, 10)
                : null;
        }, res.contextMenu.elem);

        if (res.contextMenu.itemId) {
            await this.parseMenuItems(res, contextMenuItems);
        }

        res.modeSelector = await Button.create(this, await query('.mode-selector'));
        res.showMoreBtn = { elem: await query('.show-more-btn') };
        res.showMoreSpinner = { elem: await query('.list-footer .request-spinner') };
        res.paginator = await Paginator.create(this, await query('.paginator'));

        const listContainer = await query('.list-container');
        assert(listContainer, 'List container not found');
        res.loadingIndicator = { elem: await query(listContainer, '.loading-indicator') };

        const listElem = await query('.reminder-list');
        assert(listElem, 'Reminders list element not found');
        res.remindersList = await TransactionRemindersList.create(this, listElem);

        res.itemInfo = await ReminderDetails.create(
            this,
            await query('.reminder-item-details .list-item-details'),
        );

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
            listMode: (cont.remindersList) ? cont.remindersList.listMode : 'list',
            listMenuVisible: cont.listMenu.visible,
            contextMenuVisible: cont.contextMenu.visible,
            detailsItem: this.getDetailsItem(this.getDetailsId()),
        };

        if (this.items === null) {
            this.loadReminders();
        }

        if (cont.paginator && cont.remindersList) {
            const items = cont.remindersList.getItems();
            const range = (items.length > 0)
                ? Math.ceil(items.length / App.config.transactionsOnPage)
                : 1;

            res.list = {
                page: cont.paginator.active - range + 1,
                pages: cont.paginator.pages,
                items,
                range,
            };

            res.renderTime = cont.remindersList.content.renderTime;
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

        res.isLoadingMore = cont.showMoreSpinner.visible;
        res.loading = (cont.loadingIndicator.visible || res.isLoadingMore);

        return res;
    }

    hasDetailsModeParam(url) {
        return url?.searchParams?.get('mode') === 'details';
    }

    cloneModel(model) {
        return copyObject(model);
    }

    getItems() {
        return this.items.data;
    }

    getSelectedItems() {
        return this.items.filter((item) => item.selected);
    }

    loadReminders(state = App.state) {
        this.items = state.reminders.applyFilter({
            state: REMINDER_SCHEDULED,
        });
        this.items.sort();
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

    setModelPage(model, page) {
        assert(page >= 1 && page <= model.list.pages, `Invalid page number ${page}`);

        const res = this.cloneModel(model);
        const onPage = App.config.transactionsOnPage;
        const range = 1;

        res.list.page = page;
        res.list.range = range;
        const pageItems = this.items.getPage(page, onPage, range, true);
        const { items } = TransactionRemindersList.render(pageItems.data, App.state);
        res.list.items = items;

        return res;
    }

    onPageChanged(page) {
        this.model = this.setModelPage(this.model, page);
        return this.getExpectedState();
    }

    setModelRange(model, range) {
        assert(
            range >= 1
            && range <= model.list.pages - model.list.page + 1,
            `Invalid pages range ${range}`,
        );

        const res = this.cloneModel(model);
        const onPage = App.config.transactionsOnPage;

        res.list.range = range;
        const pageItems = this.items.getPage(model.list.page, onPage, range, true);
        const { items } = TransactionRemindersList.render(pageItems.data, App.state);
        res.list.items = items;

        return res;
    }

    onRangeChanged(range) {
        this.model = this.setModelRange(this.model, range);
        return this.getExpectedState();
    }

    getDetailsId() {
        const viewPath = '/reminders/';
        const { pathname } = new URL(this.location);
        assert(pathname.startsWith(viewPath), `Invalid location path: ${pathname}`);

        if (pathname.length === viewPath.length) {
            return 0;
        }

        const param = pathname.substring(viewPath.length);
        return parseInt(param, 10) ?? 0;
    }

    getDetailsItem(itemId) {
        return App.state.reminders.getItem(itemId);
    }

    getDetailsURL(model = this.model) {
        let res = `${baseUrl()}reminders/`;

        if (model.detailsItem) {
            res += model.detailsItem.id.toString();
        }

        return res;
    }

    getExpectedURL(model = this.model) {
        const res = new URL(`${baseUrl()}reminders/`);
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
        const onPage = App.config.transactionsOnPage;
        const { page, range } = model.list;

        let items = [];
        if (page !== 0) {
            const pageItems = this.items.getPage(page, onPage, range, true);
            items = pageItems.data;
        }

        return TransactionRemindersList.render(items, App.state);
    }

    getExpectedState(model = this.model) {
        const listMode = model.listMode === 'list';
        const selectMode = model.listMode === 'select';
        const itemsCount = this.items.length;
        const isItemsAvailable = (itemsCount > 0);
        const selected = this.getSelectedItems();
        const showSelectItems = (
            isItemsAvailable
            && model.listMenuVisible
            && selectMode
        );
        const pageNum = this.currentPage(model);

        const list = this.getExpectedList(model);

        const res = {
            totalCounter: { visible: true, value: itemsCount },
            selectedCounter: { visible: selectMode, value: selected.length },
            modeSelector: { visible: isItemsAvailable },
            showMoreBtn: {
                visible: isItemsAvailable && pageNum < model.list.pages && !model.isLoadingMore,
            },
            paginator: { visible: isItemsAvailable },
            remindersList: {
                ...list,
                visible: true,
            },
            listModeBtn: { visible: !listMode },
            menuBtn: { visible: isItemsAvailable },
            listMenu: { visible: model.listMenuVisible },
        };

        if (model.detailsItem) {
            res.itemInfo = ReminderDetails.render(model.detailsItem, App.state);
            res.itemInfo.visible = true;
        }

        if (model.listMenuVisible) {
            res.selectModeBtn = {
                visible: model.listMenuVisible && listMode && isItemsAvailable,
            };
            res.selectAllBtn = {
                visible: showSelectItems && selected.length < itemsCount,
            };
            res.deselectAllBtn = {
                visible: showSelectItems && selected.length > 0,
            };
            res.confirmBtn = { visible: showSelectItems && selected.length > 0 };
            res.cancelBtn = { visible: showSelectItems && selected.length > 0 };
        }

        res.contextMenu = {
            visible: model.contextMenuVisible,
        };

        if (model.contextMenuVisible) {
            const contextItem = this.items.getItem(model.contextItem);
            assert(contextItem, 'Context item not found');

            res.contextMenu.itemId = model.contextItem;

            res.ctxDetailsBtn = { visible: true };
            res.ctxUpdateBtn = { visible: true };
            res.ctxConfirmBtn = { visible: true };
            res.ctxCancelBtn = { visible: true };
        }

        if (isItemsAvailable) {
            res.paginator = {
                ...res.paginator,
                pages: model.list.pages,
                active: pageNum,
            };

            res.modeSelector.title = (model.detailsMode)
                ? __('TR_LIST_SHOW_MAIN', this.locale)
                : __('TR_LIST_SHOW_DETAILS', this.locale);
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

    async goToFirstPage(directNavigate = false) {
        if (this.isFirstPage()) {
            return this;
        }

        const expected = this.onPageChanged(1);

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.paginator.goToFirstPage());
        }

        return App.view.checkState(expected);
    }

    async goToLastPage(directNavigate = false) {
        if (this.isLastPage()) {
            return true;
        }

        const expected = this.onPageChanged(this.pagesCount());

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.paginator.goToLastPage());
        }

        return App.view.checkState(expected);
    }

    async goToPrevPage(directNavigate = false) {
        assert(!this.isFirstPage(), 'Can\'t go to previous page');

        const expected = this.onPageChanged(this.currentPage() - 1);

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.paginator.goToPrevPage());
        }

        return App.view.checkState(expected);
    }

    async goToNextPage(directNavigate = false) {
        assert(!this.isLastPage(), 'Can\'t go to next page');

        const expected = this.onPageChanged(this.currentPage() + 1);

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.paginator.goToNextPage());
        }

        return App.view.checkState(expected);
    }

    async showMore() {
        assert(!this.isLastPage(), 'Can\'t show more items');

        const expected = this.onRangeChanged(this.currentRange() + 1);

        await this.waitForList(() => click(this.content.showMoreBtn.elem));

        return this.checkState(expected);
    }

    async openContextMenu(num) {
        await this.setListMode();

        assert.arrayIndex(this.model.list.items, num, 'Invalid transaction index');

        const item = this.content.remindersList.items[num];
        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            await item.clickMenu();
            return wait('#ctxCancelBtn', { visible: true });
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

    async toggleMode(directNavigate = false) {
        assert(this.content.modeSelector, 'Mode toggler button not available');

        this.model.detailsMode = !this.model.detailsMode;
        const expected = this.getExpectedState();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.modeSelector.click());
        }

        return App.view.checkState(expected);
    }

    async setClassicMode(directNavigate = false) {
        if (!this.model.detailsMode) {
            return true;
        }

        return this.toggleMode(directNavigate);
    }

    async setDetailsMode(directNavigate = false) {
        if (this.model.detailsMode) {
            return true;
        }

        return this.toggleMode(directNavigate);
    }

    async selectItems(data) {
        assert.isDefined(data, 'No reminders specified');
        assert(this.content.remindersList, 'No reminders available to select');

        await this.setSelectMode();

        const transactions = asArray(data);
        for (const num of transactions) {
            assert.arrayIndex(this.content.remindersList.items, num);

            const { id } = this.model.list.items[num];
            const item = this.items.getItem(id);

            this.items.update({
                ...item,
                selected: !item.selected,
            });

            const expected = this.getExpectedState();

            await this.performAction(() => this.content.remindersList.items[num].click());

            this.checkState(expected);
        }
    }

    async selectAll() {
        const selectItem = (item) => ({ ...item, selected: true });

        await this.setSelectMode();
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.items = RemindersList.create(this.items.map(selectItem));
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.selectAllBtn.click());

        return this.checkState(expected);
    }

    async deselectAll() {
        assert(this.model.listMode === 'select', 'Invalid state');

        const deselectItem = (item) => ({ ...item, selected: false });

        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.items = RemindersList.create(this.items.map(deselectItem));
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

        const item = this.content.remindersList.items[num];
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

    /** Confirms specified transaction from context menu */
    async confirmFromContextMenu(index) {
        await this.openContextMenu(index);

        const id = this.items.indexesToIds(index);
        App.state.confirmReminders({ id });
        this.loadReminders();

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        const expected = this.getExpectedState();

        await this.waitForList(() => this.content.ctxConfirmBtn.click());

        return this.checkState(expected);
    }

    /** Cancels specified transaction from context menu */
    async cancelFromContextMenu(index) {
        await this.openContextMenu(index);

        const id = this.items.indexesToIds(index);
        App.state.cancelReminders({ id });
        App.view.loadReminders();

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        const expected = this.getExpectedState();

        await this.waitForList(() => this.content.ctxCancelBtn.click());

        return this.checkState(expected);
    }

    /** Confirms specified scheduled transaction reminders */
    async confirmItems(items) {
        await this.selectItems(items);

        await this.openListMenu();

        const id = this.items.indexesToIds(items);
        const confirmRes = App.state.confirmReminders({ id });
        assert(confirmRes, 'Failed to confirm reminders');
        this.loadReminders(App.state);

        this.model.listMenuVisible = false;
        this.model.listMode = 'list';
        const expected = this.getExpectedState();

        await this.waitForList(() => this.content.confirmBtn.click());

        return this.checkState(expected);
    }

    /** Cancels specified scheduled transaction reminders */
    async cancelItems(items) {
        await this.selectItems(items);

        await this.openListMenu();

        const id = this.items.indexesToIds(items);
        App.state.cancelReminders({ id });
        App.view.loadReminders();

        this.model.listMenuVisible = false;
        this.model.listMode = 'list';
        const expected = this.getExpectedState();

        await this.waitForList(() => this.content.cancelBtn.click());

        return this.checkState(expected);
    }
}
