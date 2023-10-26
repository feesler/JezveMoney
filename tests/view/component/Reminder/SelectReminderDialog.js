import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
    click,
    waitForFunction,
    evaluate,
} from 'jezve-test';
import { Button, LinkMenu, Paginator } from 'jezvejs-test';
import { TransactionRemindersList } from './TransactionRemindersList.js';
import { DatePickerFilter } from '../Fields/DatePickerFilter.js';
import { App } from '../../../Application.js';
import {
    REMINDER_UPCOMING,
    Reminder,
} from '../../../model/Reminder.js';
import { Counter } from '../Counter.js';
import { dateToSeconds } from '../../../common.js';
import { RemindersList } from '../../../model/RemindersList.js';

/**
 * Select reminder dialog test component
 */
export class SelectReminderDialog extends TestComponent {
    static getExpectedState(model, state = App.state) {
        const filteredItems = this.getFilteredItems(model, state);
        const { filtersVisible } = model;
        const itemsCount = filteredItems.length;
        const isItemsAvailable = (itemsCount > 0);
        const pageNum = this.currentPage(model);
        const stateFilter = parseInt(model.filter.state, 10);
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
            && (isUpcoming || !model.list.pages || pageNum < model.list.pages)
            && !model.isLoadingMore
        );

        const res = {
            header: {

            },
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
            selectedCounter: { visible: false },
            modeSelector: { visible: isItemsAvailable },
            showMoreBtn: { visible: showMoreBtnVisible },
            paginator: { visible: showPaginator },
            remindersList: {
                ...list,
                visible: true,
            },
        };

        if (showPaginator) {
            res.paginator = {
                ...res.paginator,
                pages: model.list.pages,
                active: pageNum,
            };
        }

        if (isItemsAvailable) {
            res.modeSelector.value = (model.detailsMode) ? 'details' : 'classic';
        }

        return res;
    }

    static getExpectedList(model, state = App.state) {
        const onPage = App.config.transactionsOnPage;
        const { page, range } = model.list;
        const isUpcoming = (model.filter.state === REMINDER_UPCOMING);

        let items = [];

        if (page !== 0) {
            const filteredItems = this.getFilteredItems(model, state);
            const pageItems = filteredItems.getPage(page, onPage, range, !isUpcoming);
            items = pageItems;
        }

        return TransactionRemindersList.render(items, state);
    }

    static getFilteredItems(model, state = App.state) {
        const isUpcoming = (model.filter.state === REMINDER_UPCOMING);

        let sourceItems = null;

        if (isUpcoming) {
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

            const upcoming = state.getUpcomingReminders(params);
            sourceItems = RemindersList.create(upcoming.items);
            sourceItems.defaultSort(false);
        } else {
            sourceItems = state.reminders.clone();
            sourceItems.defaultSort();
        }

        const list = sourceItems.applyFilter(model.filter);
        list.defaultSort(!isUpcoming);

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

    get visible() {
        return this.content.visible;
    }

    async parseContent() {
        assert(this.elem, 'Invalid select reminder dialog element');

        const res = {
            header: {
                elem: await query(this.elem, '.dialog-header'),
            },
            closeBtn: await Button.create(this, await query(this.elem, '.close-btn')),
            filtersBtn: await Button.create(this, await query('#filtersBtn')),
            filtersContainer: { elem: await query(this.elem, '.filters-container') },
            clearFiltersBtn: { elem: await query(this.elem, '.filters-controls .clear-all-btn') },
            totalCounter: await Counter.create(this, await query(this.elem, '.items-counter')),
            selectedCounter: await Counter.create(this, await query(this.elem, '.selected-counter')),
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of dialog: '${child}' component not found`)
        ));

        res.closeFiltersBtn = { elem: await query('.filters-offcanvas .close-btn') };

        [res.filtersAnimation] = await evaluate((el) => ([
            el.querySelector('.filters-collapsible')?.classList?.contains('collapsible_animated'),
        ]), this.elem);

        // Reminder state filter
        const stateMenuEl = await query(this.elem, '.trans-type-filter .menu');
        res.stateMenu = await LinkMenu.create(this, stateMenuEl);
        assert(res.stateMenu, 'Reminder state filter not found');

        // Date range filter
        const dateRangeEl = await query(this.elem, '.date-range-filter .date-range-input');
        res.dateFilter = await DatePickerFilter.create(this, dateRangeEl);
        assert(res.dateFilter, 'Date filter not found');

        res.modeSelector = await LinkMenu.create(this, await query(this.elem, '.mode-selector'));
        res.showMoreBtn = { elem: await query(this.elem, '.show-more-btn') };
        res.showMoreSpinner = { elem: await query(this.elem, '.list-footer .request-spinner') };
        res.paginator = await Paginator.create(this, await query(this.elem, '.paginator'));

        const listContainer = await query(this.elem, '.list-container');
        assert(listContainer, 'List container not found');
        res.loadingIndicator = { elem: await query(listContainer, '.loading-indicator') };

        const listElem = await query(this.elem, '.reminder-list');
        assert(listElem, 'Reminders list element not found');
        res.remindersList = await TransactionRemindersList.create(this, listElem);

        [
            res.header.title,
        ] = await evaluate((hdrEl) => ([
            hdrEl?.querySelector('label')?.textContent,
        ]), res.header.elem);

        return res;
    }

    buildModel(cont) {
        const res = {
            filter: {
                startDate: null,
                endDate: null,
            },
            list: {
                page: 0,
                pages: 0,
                items: [],
                range: 1,
            },
            listMode: (cont.remindersList) ? cont.remindersList.listMode : 'list',
            filtersVisible: cont.filtersContainer.visible,
            filtersAnimation: !!cont.filtersAnimation,
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
            res.list.page = activePage - range + 1;
            res.list.range = range;
            res.list.items = items;

            if (paginatorVisible) {
                res.list.pages = cont.paginator.pages;
            }

            res.renderTime = cont.remindersList.content.renderTime;
        }

        if (this.items === null) {
            this.loadReminders({ model: res });
        }

        if (isUpcoming && res.filter.endDate) {
            res.list.pages = this.upcomingPagination?.pagesCount;
        }

        res.detailsMode = cont.modeSelector?.content?.value === 'details';

        res.isLoadingMore = cont.showMoreSpinner.visible;
        res.loading = (cont.loadingIndicator.visible || res.isLoadingMore);

        return res;
    }

    cloneModel(model) {
        return structuredClone(model);
    }

    updateModelFilter(model) {
        const res = this.cloneModel(model);
        const isUpcoming = (res.filter.state === REMINDER_UPCOMING);

        this.loadReminders({ model: res });

        const filteredItems = this.getFilteredItems(res);
        if (filteredItems.length > 0) {
            const onPage = App.config.transactionsOnPage;
            const pageItems = filteredItems.getPage(1, onPage, 1, !isUpcoming);
            const { items } = TransactionRemindersList.render(pageItems, App.state);

            res.list = {
                page: 1,
                items,
            };

            if (!isUpcoming) {
                res.list.pages = filteredItems.expectedPages();
            } else {
                res.list.pages = 1;
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
        return this.getSourceItems();
    }

    loadReminders(options = {}) {
        const {
            model = this.model,
            state = App.state,
        } = options;

        this.items = state.reminders.clone();
        this.items.defaultSort();

        // Upcoming reminders
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

        const upcoming = state.getUpcomingReminders(params);
        this.upcomingItems = RemindersList.create(upcoming.items);
        this.upcomingItems.defaultSort(false);

        this.upcomingPagination = upcoming.pagination;
    }

    getSelectedItems(model = this.model) {
        return SelectReminderDialog.getSelectedItems(model);
    }

    getSelectedIds(model = this.model) {
        return this.getSelectedItems(model).map((item) => item.id);
    }

    currentPage(model = this.model) {
        return SelectReminderDialog.currentPage(model);
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

        this.loadReminders({ model: res, keepState: true });

        const filteredItems = this.getFilteredItems(res);
        const pageItems = filteredItems.getPage(page, onPage, range, !isUpcoming);
        const { items } = TransactionRemindersList.render(pageItems, App.state);
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

        this.loadReminders({ model: res, keepState: true });

        const filteredItems = this.getFilteredItems(res);
        const pageItems = filteredItems.getPage(res.list.page, onPage, range, !isUpcoming);
        const { items } = TransactionRemindersList.render(pageItems, App.state);
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
            const { items } = TransactionRemindersList.render(pageItems, App.state);

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
        return SelectReminderDialog.getFilteredItems(model);
    }

    getExpectedState(model = this.model) {
        return SelectReminderDialog.getExpectedState(model);
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

    async close() {
        await this.content.closeBtn.click();
    }

    async waitForAnimation(action) {
        const expectedVisibility = this.model.filtersVisible;

        await this.parse();

        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.filtersAnimation
                && this.model.filtersVisible === expectedVisibility
            );
        });

        await this.parse();
    }

    async openFilters() {
        if (this.model.filtersVisible) {
            return true;
        }

        this.model.filtersVisible = true;
        const expected = this.getExpectedState();

        await this.waitForAnimation(() => this.content.filtersBtn.click());

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
            await this.waitForAnimation(() => click(closeFiltersBtn.elem));
        } else {
            await this.waitForAnimation(() => this.content.filtersBtn.click());
        }

        return this.checkState(expected);
    }

    async clearAllFilters() {
        await this.openFilters();

        this.model.filter = {
            state: this.model.filter.state,
            startDate: null,
            endDate: null,
        };
        const expected = this.onFilterUpdate();

        await this.waitForList(() => click(this.content.clearFiltersBtn.elem));

        return this.checkState(expected);
    }

    async filterByState(state) {
        const stateType = parseInt(state, 10);
        assert(Reminder.allStates.includes(stateType), 'Invalid reminder state');

        if (this.model.filter.state === stateType) {
            return true;
        }

        await this.openFilters();

        this.model.filter.state = stateType;
        this.model.list.page = 1;
        this.model.list.range = 1;
        const expected = this.onFilterUpdate();

        await this.waitForList(() => this.content.stateMenu.selectItemByValue(state));

        return this.checkState(expected);
    }

    async selectStartDateFilter(value) {
        await this.openFilters();

        const date = new Date(App.parseDate(value));
        const startDate = dateToSeconds(date);
        if (this.model.filter.startDate === startDate) {
            return true;
        }

        this.model.filter.startDate = startDate;
        const expected = this.onFilterUpdate();

        await this.waitForList(() => this.content.dateFilter.selectStart(date));

        return this.checkState(expected);
    }

    async selectEndDateFilter(value) {
        await this.openFilters();

        const date = new Date(App.parseDate(value));
        const endDate = dateToSeconds(date);
        if (this.model.filter.endDate === endDate) {
            return true;
        }

        this.model.filter.endDate = endDate;
        const expected = this.onFilterUpdate();

        await this.waitForList(() => this.content.dateFilter.selectEnd(date));

        return this.checkState(expected);
    }

    async clearStartDateFilter() {
        await this.openFilters();

        this.model.filter.startDate = null;
        const expected = this.onFilterUpdate();

        await this.waitForList(() => this.content.dateFilter.clearStart());

        return this.checkState(expected);
    }

    async clearEndDateFilter() {
        await this.openFilters();

        this.model.filter.endDate = null;
        const expected = this.onFilterUpdate();

        await this.waitForList(() => this.content.dateFilter.clearEnd());

        return this.checkState(expected);
    }

    async goToFirstPage() {
        if (this.isFirstPage()) {
            return true;
        }

        await this.closeFilters();
        const expected = this.onPageChanged(1);

        await this.waitForList(() => this.content.paginator.goToFirstPage());

        return this.checkState(expected);
    }

    async goToLastPage() {
        if (this.isLastPage()) {
            return true;
        }

        await this.closeFilters();
        const expected = this.onPageChanged(this.pagesCount());

        await this.waitForList(() => this.content.paginator.goToLastPage());

        return this.checkState(expected);
    }

    async goToPrevPage() {
        assert(!this.isFirstPage(), 'Can\'t go to previous page');

        await this.closeFilters();
        const expected = this.onPageChanged(this.currentPage() - 1);

        await this.waitForList(() => this.content.paginator.goToPrevPage());

        return this.checkState(expected);
    }

    async goToNextPage() {
        assert(!this.isLastPage(), 'Can\'t go to next page');

        await this.closeFilters();
        const expected = this.onPageChanged(this.currentPage() + 1);

        await this.waitForList(() => this.content.paginator.goToNextPage());

        return this.checkState(expected);
    }

    async showMore() {
        assert(!this.isLastPage(), 'Can\'t show more items');

        await this.closeFilters();
        const expected = this.onRangeChanged(this.currentRange() + 1);

        await this.waitForList(() => click(this.content.showMoreBtn.elem));

        return this.checkState(expected);
    }

    async toggleMode() {
        assert(this.content.modeSelector, 'Mode toggler button not available');

        await this.closeFilters();

        this.model.detailsMode = !this.model.detailsMode;
        const mode = (this.model.detailsMode) ? 'details' : 'classic';
        const expected = this.getExpectedState();

        await this.waitForList(() => this.content.modeSelector.selectItemByValue(mode));

        return this.checkState(expected);
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

    getItemByIndex(index) {
        const isUpcoming = (this.model.filter.state === REMINDER_UPCOMING);

        assert.arrayIndex(this.content.remindersList.items, index);
        const sourceItems = this.getSourceItems();

        let item;
        if (isUpcoming) {
            const absIndex = this.getAbsoluteIndex(index);
            item = sourceItems.getItemByIndex(absIndex);
        } else {
            const { id } = this.model.list.items[index];
            item = sourceItems.getItem(id);
        }

        assert(item, `Item [${index}] not found`);
        return item;
    }

    async selectItemByIndex(index) {
        assert(this.content.remindersList, 'No reminders available to select');
        assert.arrayIndex(this.content.remindersList.items, index);

        return this.content.remindersList.items[index].click();
    }
}
