import {
    assert,
    asArray,
    query,
    evaluate,
    navigation,
    click,
    waitForFunction,
    goTo,
    baseUrl,
    wait,
    prop,
} from 'jezve-test';
import {
    Button,
    LinkMenu,
    Paginator,
    PopupMenu,
} from 'jezvejs-test';
import { App } from '../Application.js';
import { __ } from '../model/locale.js';
import { RemindersList } from '../model/RemindersList.js';
import { AppView } from './AppView.js';
import { Counter } from './component/Counter.js';
import { DatePickerFilter } from './component/Fields/DatePickerFilter.js';
import { ReminderDetails } from './component/Reminder/ReminderDetails.js';
import { TransactionRemindersList } from './component/Reminder/TransactionRemindersList.js';
import {
    REMINDER_CANCELLED,
    REMINDER_CONFIRMED,
    REMINDER_SCHEDULED,
    REMINDER_UPCOMING,
    Reminder,
} from '../model/Reminder.js';
import { dateToSeconds } from '../common.js';

const listMenuSelector = '#listMenu';

/** Scheduled transactions list view class */
export class ReminderListView extends AppView {
    static getExpectedState(model, state = App.state) {
        const filteredItems = this.getFilteredItems(model);
        const { filtersVisible } = model;
        const listMode = model.listMode === 'list';
        const selectMode = model.listMode === 'select';
        const itemsCount = filteredItems.length;
        const isItemsAvailable = (itemsCount > 0);
        const selected = this.getSelectedItems(model);
        const showSelectItems = (
            isItemsAvailable
            && model.listMenuVisible
            && selectMode
        );
        const pageNum = this.currentPage(model);

        const stateFilter = parseInt(model.filter.state, 10);
        const isConfirmed = stateFilter === REMINDER_CONFIRMED;
        const isCancelled = stateFilter === REMINDER_CANCELLED;
        const isUpcoming = stateFilter === REMINDER_UPCOMING;

        const { startDate, endDate } = model.filter;

        let startDateFmt = '';
        if (startDate) {
            const dateFmt = App.secondsToDateString(startDate);
            startDateFmt = App.reformatDate(dateFmt);
        }

        let endDateFmt = '';
        if (endDate) {
            const dateFmt = App.secondsToDateString(endDate);
            endDateFmt = App.reformatDate(dateFmt);
        }

        const list = this.getExpectedList(model);

        const showPaginator = !isUpcoming && isItemsAvailable;
        const showMoreBtnVisible = (
            isItemsAvailable
            && (!model.list.pages || pageNum < model.list.pages)
            && !model.isLoadingMore
        );

        const res = {
            stateMenu: {
                value: model.filter.state.toString(),
                visible: filtersVisible,
            },
            dateFilter: {
                visible: filtersVisible,
                value: {
                    startDate: startDateFmt,
                    endDate: endDateFmt,
                },
            },
            clearFiltersBtn: {
                visible: filtersVisible,
            },
            totalCounter: { visible: true, value: filteredItems.length },
            selectedCounter: { visible: selectMode, value: selected.length },
            modeSelector: { visible: isItemsAvailable },
            showMoreBtn: { visible: showMoreBtnVisible },
            paginator: { visible: showPaginator },
            remindersList: {
                ...list,
                visible: true,
            },
            listModeBtn: { visible: !listMode },
            menuBtn: { visible: isItemsAvailable },
        };

        if (model.detailsItem) {
            res.itemInfo = ReminderDetails.getExpectedState(model.detailsItem, state);
            res.itemInfo.visible = true;
        }

        if (model.listMenuVisible) {
            res.listMenu = {
                visible: true,
                selectModeBtn: {
                    visible: listMode && isItemsAvailable,
                },
                selectAllBtn: {
                    visible: showSelectItems && selected.length < itemsCount,
                },
                deselectAllBtn: {
                    visible: showSelectItems && selected.length > 0,
                },
                confirmBtn: {
                    visible: showSelectItems && selected.length > 0 && !isConfirmed,
                },
                cancelBtn: {
                    visible: showSelectItems && selected.length > 0 && !isCancelled,
                },
            };
        }

        if (model.contextMenuVisible) {
            const sourceItems = App.view.getSourceItems(model);
            let contextItem = null;
            if (isUpcoming) {
                const strId = model.contextItem?.toString();
                const index = model.list.items.findIndex((item) => item?.id?.toString() === strId);
                const absIndex = App.view.getAbsoluteIndex(index, model);
                contextItem = sourceItems.getItemByIndex(absIndex);
            } else {
                contextItem = sourceItems.getItem(model.contextItem);
            }
            assert(contextItem, 'Context item not found');

            res.contextMenu = {
                visible: true,
                itemId: model.contextItem.toString(),
                ctxDetailsBtn: { visible: contextItem.state !== REMINDER_UPCOMING },
                ctxUpdateBtn: { visible: contextItem.state !== REMINDER_CONFIRMED },
                ctxConfirmBtn: { visible: contextItem.state !== REMINDER_CONFIRMED },
                ctxCancelBtn: { visible: contextItem.state !== REMINDER_CANCELLED },
            };
        }

        if (showPaginator) {
            res.paginator = {
                ...res.paginator,
                pages: model.list.pages,
                active: pageNum,
            };
        }

        if (isItemsAvailable) {
            res.modeSelector.title = (model.detailsMode)
                ? __('transactions.showMain', App.view.locale)
                : __('transactions.showDetails', App.view.locale);
        }

        return res;
    }

    static getExpectedList(model, state = App.state) {
        const onPage = App.config.transactionsOnPage;
        const { page, range } = model.list;
        const isUpcoming = (model.filter.state === REMINDER_UPCOMING);

        let items = [];

        if (page !== 0) {
            const filteredItems = this.getFilteredItems(model);
            const pageItems = filteredItems.getPage(page, onPage, range, !isUpcoming);
            items = pageItems.data;
        }

        return TransactionRemindersList.render(items, state);
    }

    static getFilteredItems(model) {
        assert.instanceOf(App.view, ReminderListView, 'Invalid view');

        const isUpcoming = (model.filter.state === REMINDER_UPCOMING);
        const sourceItems = App.view.getSourceItems(model);

        const list = sourceItems.applyFilter(model.filter);
        list.sort(!isUpcoming);

        return list;
    }

    static getSelectedItems(model = this.model) {
        const filteredItems = this.getFilteredItems(model);
        return filteredItems.filter((item) => item.selected);
    }

    static currentPage(model) {
        return model.list.page + model.list.range - 1;
    }

    constructor(...args) {
        super(...args);

        this.items = null;
        this.upcomingItems = null;
        this.upcomingPagination = null;
    }

    get listMenu() {
        return this.content.listMenu;
    }

    get contextMenu() {
        return this.content.contextMenu;
    }

    async parseContent() {
        const res = {
            filtersBtn: await Button.create(this, await query('#filtersBtn')),
            filtersContainer: { elem: await query('#filtersContainer') },
            clearFiltersBtn: { elem: await query('.filters-controls .clear-all-btn') },
            closeFiltersBtn: { elem: await query('#closeFiltersBtn') },
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
        res.listMenu = await PopupMenu.create(this, await query(listMenuSelector));

        // Context menu
        res.contextMenu = await PopupMenu.create(this, await query('#contextMenu'));
        if (res.contextMenu?.elem) {
            res.contextMenu.content.itemId = await evaluate((menuEl) => {
                const contextParent = menuEl?.closest('.reminder-item');
                return contextParent?.dataset.id ?? null;
            }, res.contextMenu.elem);
        }

        // Reminder state filter
        res.stateMenu = await LinkMenu.create(this, await query('#stateMenu'));

        // Date range filter
        res.dateFilter = await DatePickerFilter.create(this, await query('#dateFilter'));
        assert(res.dateFilter, 'Date filter not found');

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

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            filter: {
                startDate: null,
                endDate: null,
            },
            contextItem: cont.contextMenu?.content?.itemId?.toString(),
            listMode: (cont.remindersList) ? cont.remindersList.listMode : 'list',
            listMenuVisible: cont.listMenu?.visible,
            contextMenuVisible: cont.contextMenu?.visible,
            filtersVisible: cont.filtersContainer.visible,
            detailsItem: this.getDetailsItem(this.getDetailsId()),
        };

        const reminderState = parseInt(cont.stateMenu.value, 10);
        assert(Reminder.allStates.includes(reminderState), 'Invalid reminder state');
        const isUpcoming = reminderState === REMINDER_UPCOMING;
        res.filter.state = reminderState;

        const dateRange = cont.dateFilter.getSelectedRange();
        if (dateRange?.startDate) {
            const startDate = new Date(App.parseDate(dateRange.startDate));
            res.filter.startDate = dateToSeconds(startDate);
        }
        if (dateRange?.endDate) {
            const endDate = new Date(App.parseDate(dateRange.endDate));
            res.filter.endDate = dateToSeconds(endDate);
        }

        if (cont.remindersList) {
            const items = cont.remindersList.getItems();
            const range = (items.length > 0)
                ? Math.ceil(items.length / App.config.transactionsOnPage)
                : 1;

            const paginatorVisible = cont.paginator?.content?.visible;
            const activePage = (paginatorVisible)
                ? cont.paginator.active
                : range;
            const page = activePage - range + 1;

            res.list = {
                page,
                items,
                range,
            };

            if (paginatorVisible) {
                res.list.pages = cont.paginator.pages;
            }

            res.renderTime = cont.remindersList.content.renderTime;
        } else {
            res.list = {
                page: 0,
                pages: 0,
                items: [],
                range: 1,
            };
        }

        if (this.items === null) {
            this.loadReminders(res);
        }

        if (isUpcoming && res.filter.endDate) {
            res.list.pages = this.upcomingPagination?.pagesCount;
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
        return structuredClone(model);
    }

    updateModelFilter(model) {
        const res = this.cloneModel(model);
        const isUpcoming = (res.filter.state === REMINDER_UPCOMING);

        this.loadReminders(res);

        const filteredItems = this.getFilteredItems(res);
        if (filteredItems.length > 0) {
            const onPage = App.config.transactionsOnPage;
            const pageItems = filteredItems.getPage(1, onPage, 1, !isUpcoming);
            const { items } = TransactionRemindersList.render(pageItems.data, App.state);

            res.list = {
                page: 1,
                items,
            };

            if (!isUpcoming) {
                res.list.pages = filteredItems.expectedPages();
            }
        } else {
            res.list = {
                page: 0,
                pages: 0,
                items: [],
            };
        }

        if (isUpcoming && res.filter.endDate) {
            res.list.pages = this.upcomingPagination?.pagesCount;
        }

        res.list.range = 1;

        return res;
    }

    onFilterUpdate() {
        this.model = this.updateModelFilter(this.model);
        return this.getExpectedState();
    }

    getItems() {
        return this.getSourceItems().data;
    }

    loadReminders(model = this.model, state = App.state) {
        this.items = state.reminders.clone();
        this.items.sort();

        this.loadUpcomingReminders(model, state);
    }

    loadUpcomingReminders(model = this.model, state = App.state) {
        const { filter, list } = model;

        const params = {
            page: list.page,
            range: list.range,
        };
        if (filter.startDate) {
            params.startDate = filter.startDate;
        }
        if (filter.endDate) {
            params.endDate = filter.endDate;
        }

        const { items, pagination } = state.getUpcomingReminders(params);
        this.upcomingItems = RemindersList.create(items);
        this.upcomingItems.sort(false);

        this.upcomingPagination = pagination;
    }

    currentPage(model = this.model) {
        return ReminderListView.currentPage(model);
    }

    currentRange(model = this.model) {
        return model.list.range;
    }

    pagesCount(model = this.model) {
        return model.list.pages;
    }

    getAbsoluteIndex(index, model = this.model) {
        const ind = parseInt(index, 10);
        const onPage = App.config.transactionsOnPage;
        const { page } = model.list;

        return (page - 1) * onPage + ind;
    }

    isFirstPage() {
        return !this.content.paginator || this.content.paginator.isFirstPage();
    }

    isLastPage() {
        const isUpcoming = this.model.filter.state === REMINDER_UPCOMING;

        return (
            !isUpcoming
            && (!this.content.paginator || this.content.paginator.isLastPage())
        );
    }

    setModelPage(model, page) {
        assert(page >= 1 && page <= model.list.pages, `Invalid page number ${page}`);

        const res = this.cloneModel(model);
        const onPage = App.config.transactionsOnPage;
        const isUpcoming = res.filter.state === REMINDER_UPCOMING;
        const range = 1;

        res.list.page = page;
        res.list.range = range;

        this.loadReminders(res);

        const filteredItems = this.getFilteredItems(res);
        const pageItems = filteredItems.getPage(page, onPage, range, !isUpcoming);
        const { items } = TransactionRemindersList.render(pageItems.data, App.state);
        res.list.items = items;

        return res;
    }

    onPageChanged(page) {
        this.model = this.setModelPage(this.model, page);
        return this.getExpectedState();
    }

    setModelRange(model, range) {
        const res = this.cloneModel(model);
        const onPage = App.config.transactionsOnPage;
        const isUpcoming = res.filter.state === REMINDER_UPCOMING;

        if (!isUpcoming) {
            assert(
                range >= 1
                && range <= res.list.pages - res.list.page + 1,
                `Invalid pages range ${range}`,
            );
        }

        res.list.range = range;

        this.loadReminders(res);

        const filteredItems = this.getFilteredItems(res);
        const pageItems = filteredItems.getPage(res.list.page, onPage, range, !isUpcoming);
        const { items } = TransactionRemindersList.render(pageItems.data, App.state);
        res.list.items = items;

        return res;
    }

    onRangeChanged(range) {
        this.model = this.setModelRange(this.model, range);
        return this.getExpectedState();
    }

    onListUpdated(model = this.model) {
        const res = this.cloneModel(model);
        const isUpcoming = (res.filter.state === REMINDER_UPCOMING);

        const filteredItems = this.getFilteredItems(model);
        if (filteredItems.length > 0) {
            const onPage = App.config.transactionsOnPage;
            const pages = filteredItems.expectedPages();
            const page = Math.min(model.list.page, pages);
            const range = Math.min(model.list.range, pages - page + 1);

            const pageItems = filteredItems.getPage(page, onPage, range, !isUpcoming);
            const { items } = TransactionRemindersList.render(pageItems.data, App.state);

            res.list = {
                page,
                items,
                range,
            };

            if (!isUpcoming) {
                res.list.pages = pages;
            }
        } else {
            res.list = {
                page: 0,
                pages: 0,
                items: [],
                range: 1,
            };
        }

        if (isUpcoming && res.filter.endDate) {
            res.list.pages = this.upcomingPagination?.pagesCount;
        }

        this.model = res;

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

        if (model.filter.state !== REMINDER_SCHEDULED) {
            params.state = Reminder.stateNames[model.filter.state];
        }

        if (model.filter.startDate) {
            params.startDate = model.filter.startDate;
        }
        if (model.filter.endDate) {
            params.endDate = model.filter.endDate;
        }

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

    getSourceItems(model = this.model) {
        const isUpcoming = (model.filter.state === REMINDER_UPCOMING);
        return (isUpcoming) ? this.upcomingItems : this.items;
    }

    setSourceItems(items, model = this.model) {
        const isUpcoming = (model.filter.state === REMINDER_UPCOMING);
        const list = RemindersList.create(items);

        if (isUpcoming) {
            this.upcomingItems = list;
        } else {
            this.items = list;
        }
    }

    getFilteredItems(model = this.model) {
        return ReminderListView.getFilteredItems(model);
    }

    getExpectedState(model = this.model) {
        return ReminderListView.getExpectedState(model);
    }

    async waitForLoad() {
        await waitForFunction(async () => {
            await this.parse();
            return !!this.model.renderTime;
        });

        await this.parse();
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

    async goToExpectedURL() {
        await goTo(this.getExpectedURL());
        return App.view.waitForLoad();
    }

    async goToDetailsURL() {
        await goTo(this.getDetailsURL());
        return App.view.waitForLoad();
    }

    async openFilters() {
        if (this.model.filtersVisible) {
            return true;
        }

        this.model.filtersVisible = true;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.filtersBtn.click());

        return this.checkState(expected);
    }

    async closeFilters() {
        if (!this.model.filtersVisible) {
            return true;
        }

        this.model.filtersVisible = false;
        const expected = this.getExpectedState();

        const { closeFiltersBtn } = this.content;
        if (closeFiltersBtn.visible) {
            await this.performAction(() => click(closeFiltersBtn.elem));
        } else {
            await this.performAction(() => this.content.filtersBtn.click());
        }

        return this.checkState(expected);
    }

    async clearAllFilters(directNavigate = false) {
        if (!directNavigate) {
            await this.openFilters();
        }

        this.model.filter = {
            state: this.model.filter.state,
            startDate: null,
            endDate: null,
        };
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await this.goToExpectedURL();
        } else {
            await this.waitForList(() => click(this.content.clearFiltersBtn.elem));
        }

        return App.view.checkState(expected);
    }

    async filterByState(state, directNavigate = false) {
        const stateType = parseInt(state, 10);
        assert(Reminder.allStates.includes(stateType), 'Invalid reminder state');

        if (this.model.filter.state === stateType && !directNavigate) {
            return true;
        }

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        this.model.filter.state = stateType;
        this.model.list.page = 1;
        this.model.list.range = 1;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await this.goToExpectedURL();
        } else {
            await this.waitForList(() => this.content.stateMenu.selectItemByValue(state));
        }

        return App.view.checkState(expected);
    }

    async selectStartDateFilter(value, directNavigate = false) {
        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        const date = new Date(App.parseDate(value));
        const startDate = dateToSeconds(date);
        if (this.model.filter.startDate === startDate) {
            return true;
        }

        this.model.filter.startDate = startDate;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await this.goToExpectedURL();
        } else {
            await this.waitForList(() => this.content.dateFilter.selectStart(date));
        }

        return App.view.checkState(expected);
    }

    async selectEndDateFilter(value, directNavigate = false) {
        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        const date = new Date(App.parseDate(value));
        const endDate = dateToSeconds(date);
        if (this.model.filter.endDate === endDate) {
            return true;
        }

        this.model.filter.endDate = endDate;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await this.goToExpectedURL();
        } else {
            await this.waitForList(() => this.content.dateFilter.selectEnd(date));
        }

        return App.view.checkState(expected);
    }

    async clearStartDateFilter(directNavigate = false) {
        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        this.model.filter.startDate = null;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await this.goToExpectedURL();
        } else {
            await this.waitForList(() => this.content.dateFilter.clearStart());
        }

        return App.view.checkState(expected);
    }

    async clearEndDateFilter(directNavigate = false) {
        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        this.model.filter.endDate = null;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await this.goToExpectedURL();
        } else {
            await this.waitForList(() => this.content.dateFilter.clearEnd());
        }

        return App.view.checkState(expected);
    }

    async goToFirstPage(directNavigate = false) {
        if (this.isFirstPage()) {
            return true;
        }

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.closeFilters();
        }
        const expected = this.onPageChanged(1);

        if (directNavigate) {
            await this.goToExpectedURL();
        } else {
            await this.waitForList(() => this.content.paginator.goToFirstPage());
        }

        return App.view.checkState(expected);
    }

    async goToLastPage(directNavigate = false) {
        if (this.isLastPage()) {
            return true;
        }

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.closeFilters();
        }
        const expected = this.onPageChanged(this.pagesCount());

        if (directNavigate) {
            await this.goToExpectedURL();
        } else {
            await this.waitForList(() => this.content.paginator.goToLastPage());
        }

        return App.view.checkState(expected);
    }

    async goToPrevPage(directNavigate = false) {
        assert(!this.isFirstPage(), 'Can\'t go to previous page');

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.closeFilters();
        }
        const expected = this.onPageChanged(this.currentPage() - 1);

        if (directNavigate) {
            await this.goToExpectedURL();
        } else {
            await this.waitForList(() => this.content.paginator.goToPrevPage());
        }

        return App.view.checkState(expected);
    }

    async goToNextPage(directNavigate = false) {
        assert(!this.isLastPage(), 'Can\'t go to next page');

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.closeFilters();
        }
        const expected = this.onPageChanged(this.currentPage() + 1);

        if (directNavigate) {
            await this.goToExpectedURL();
        } else {
            await this.waitForList(() => this.content.paginator.goToNextPage());
        }

        return App.view.checkState(expected);
    }

    async showMore() {
        assert(!this.isLastPage(), 'Can\'t show more items');

        await this.closeFilters();

        const expected = this.onRangeChanged(this.currentRange() + 1);

        await this.waitForList(() => click(this.content.showMoreBtn.elem));

        return this.checkState(expected);
    }

    async openContextMenu(num) {
        await this.closeFilters();
        await this.setListMode();

        assert.arrayIndex(this.model.list.items, num, 'Invalid transaction index');

        const isUpcoming = (this.model.filter.state === REMINDER_UPCOMING);

        const item = this.content.remindersList.items[num];
        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;

        const expected = this.getExpectedState();

        await this.performAction(async () => {
            await item.clickMenu();
            const selector = (isUpcoming) ? '#ctxCancelBtn' : '#ctxDetailsBtn';
            return wait(selector, { visible: true });
        });

        return this.checkState(expected);
    }

    async openListMenu() {
        assert(!this.listMenu?.visible, 'List menu already opened');

        await this.closeFilters();

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

        if (listMode === 'list') {
            await this.performAction(() => this.content.listModeBtn.click());
        } else if (listMode === 'select') {
            await this.performAction(() => this.listMenu.select('selectModeBtn'));
        }

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

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.closeFilters();
        }

        this.model.detailsMode = !this.model.detailsMode;
        const expected = this.getExpectedState();

        if (directNavigate) {
            await this.goToExpectedURL();
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

        const isUpcoming = (this.model.filter.state === REMINDER_UPCOMING);

        const transactions = asArray(data);
        for (const num of transactions) {
            assert.arrayIndex(this.content.remindersList.items, num);

            const sourceItems = this.getSourceItems();

            if (isUpcoming) {
                const absIndex = this.getAbsoluteIndex(num);
                const item = sourceItems.getItemByIndex(absIndex);
                assert(item, 'Item not found');

                sourceItems.updateByIndex({
                    ...item,
                    selected: !item.selected,
                }, absIndex);
            } else {
                const { id } = this.model.list.items[num];
                const item = sourceItems.getItem(id);
                assert(item, 'Item not found');

                sourceItems.update({
                    ...item,
                    selected: !item.selected,
                });
            }

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
        const sourceItems = this.getSourceItems();
        this.setSourceItems(sourceItems.map(selectItem));

        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('selectAllBtn'));

        return this.checkState(expected);
    }

    async deselectAll() {
        assert(this.model.listMode === 'select', 'Invalid state');

        const deselectItem = (item) => ({ ...item, selected: false });

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const sourceItems = this.getSourceItems();
        this.setSourceItems(sourceItems.map(deselectItem));

        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('deselectAllBtn'));

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
            await this.goToDetailsURL();
        } else {
            await this.performAction(() => this.contextMenu.select('ctxDetailsBtn'));
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
            await this.goToDetailsURL();
        } else {
            await this.performAction(() => this.content.itemInfo.close());
        }

        return App.view.checkState(expected);
    }

    /** Opens context menu for specified item and clicks on 'update' item */
    async goToUpdateItem(num) {
        await this.openContextMenu(num);

        return navigation(() => this.contextMenu.select('ctxUpdateBtn'));
    }

    getFilteredIdsByIndexes(index, model = this.model) {
        return this.getFilteredItems(model).indexesToIds(index);
    }

    getRequestData(index, model = this.model) {
        const isUpcoming = (model.filter.state === REMINDER_UPCOMING);
        const filteredItems = this.getFilteredItems(model);
        if (isUpcoming) {
            const items = filteredItems.getItemsByIndexes(index);
            return {
                upcoming: items.map((item) => ({
                    schedule_id: item.schedule_id,
                    date: item.date,
                })),
            };
        }

        const id = filteredItems.indexesToIds(index);
        return { id };
    }

    /** Confirms specified transaction from context menu */
    async confirmFromContextMenu(index) {
        await this.openContextMenu(index);

        const request = this.getRequestData(index);
        App.state.confirmReminders(request);

        this.loadReminders();
        this.model.contextMenuVisible = false;
        this.model.contextItem = null;

        const expected = this.onListUpdated();

        await this.waitForList(() => this.contextMenu.select('ctxConfirmBtn'));

        return this.checkState(expected);
    }

    /** Cancels specified transaction from context menu */
    async cancelFromContextMenu(index) {
        await this.openContextMenu(index);

        const request = this.getRequestData(index);
        App.state.cancelReminders(request);

        this.loadReminders();
        this.model.contextMenuVisible = false;
        this.model.contextItem = null;

        const expected = this.onListUpdated();

        await this.waitForList(() => this.contextMenu.select('ctxCancelBtn'));

        return this.checkState(expected);
    }

    /** Confirms specified scheduled transaction reminders */
    async confirmItems(items) {
        await this.selectItems(items);
        await this.openListMenu();

        const request = this.getRequestData(items);
        const confirmRes = App.state.confirmReminders(request);
        assert(confirmRes, 'Failed to confirm reminders');

        this.loadReminders();
        this.model.listMenuVisible = false;
        this.model.listMode = 'list';

        const expected = this.onListUpdated();

        await this.waitForList(() => this.listMenu.select('confirmBtn'));

        return this.checkState(expected);
    }

    /** Cancels specified scheduled transaction reminders */
    async cancelItems(items) {
        await this.selectItems(items);
        await this.openListMenu();

        const request = this.getRequestData(items);
        App.state.cancelReminders(request);

        this.loadReminders();
        this.model.listMenuVisible = false;
        this.model.listMode = 'list';

        const expected = this.onListUpdated();

        await this.waitForList(() => this.listMenu.select('cancelBtn'));

        return this.checkState(expected);
    }
}
