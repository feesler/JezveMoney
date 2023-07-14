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
    isVisible,
    wait,
    httpReq,
} from 'jezve-test';
import {
    Button,
    DropDown,
    Paginator,
    PopupMenu,
} from 'jezvejs-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { WarningPopup } from './component/WarningPopup.js';
import { DatePickerFilter } from './component/Fields/DatePickerFilter.js';
import { TransactionTypeMenu } from './component/Fields/TransactionTypeMenu.js';
import { SearchInput } from './component/Fields/SearchInput.js';
import { TransactionList } from './component/TransactionList/TransactionList.js';
import { Counter } from './component/Counter.js';
import { SetCategoryDialog } from './component/TransactionList/SetCategoryDialog.js';
import {
    dateToSeconds,
    secondsToDate,
    shiftMonth,
} from '../common.js';
import { __ } from '../model/locale.js';
import { TransactionDetails } from './component/Transaction/TransactionDetails.js';

const listMenuSelector = '#listMenu';
const categoryDialogSelector = '#selectCategoryDialog';

/** List of transactions view class */
export class TransactionListView extends AppView {
    get accDropDown() {
        return this.content.accDropDown;
    }

    get categoryDropDown() {
        return this.content.categoryDropDown;
    }

    get listMenu() {
        return this.content.listMenu;
    }

    get contextMenu() {
        return this.content.contextMenu;
    }

    async parseContent() {
        const res = {
            createBtn: await Button.create(this, await query('#createBtn')),
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

        // Main menu
        res.listMenu = await PopupMenu.create(this, await query(listMenuSelector));

        // Context menu
        res.contextMenu = await PopupMenu.create(this, await query('#contextMenu'));
        if (res.contextMenu?.elem) {
            res.contextMenu.content.itemId = await evaluate((menuEl) => {
                const contextParent = menuEl?.closest('.trans-item');
                return (contextParent)
                    ? parseInt(contextParent.dataset.id, 10)
                    : null;
            }, res.contextMenu.elem);
        }

        res.typeMenu = await TransactionTypeMenu.create(this, await query('.trtype-menu'));
        assert(res.typeMenu, 'Types menu not found');

        const accountsFilter = await query('#accountsFilter');
        const accountsFilterVisible = await isVisible(accountsFilter);
        if (accountsFilterVisible) {
            res.accDropDown = await DropDown.createFromChild(this, await query('#acc_id'));
        }

        const categoriesFilter = await query('#categoriesFilter');
        const categoriesFilterVisible = await isVisible(categoriesFilter);
        if (categoriesFilterVisible) {
            res.categoryDropDown = await DropDown.createFromChild(this, await query('#category_id'));
        }

        res.dateFilter = await DatePickerFilter.create(this, await query('#dateFilter'));
        assert(res.dateFilter, 'Date filter not found');

        res.weekRangeBtn = { elem: await query('.range-selector-btn[data-range="week"]') };
        res.monthRangeBtn = { elem: await query('.range-selector-btn[data-range="month"]') };
        res.halfYearRangeBtn = { elem: await query('.range-selector-btn[data-range="halfyear"]') };

        res.searchForm = await SearchInput.create(this, await query('#searchFilter .search-field'));
        assert(res.searchForm, 'Search form not found');

        const listContainer = await query('.list-container');
        assert(listContainer, 'List container not found');
        res.loadingIndicator = { elem: await query(listContainer, '.loading-indicator') };

        res.modeSelector = await Button.create(this, await query('.mode-selector'));
        res.paginator = await Paginator.create(this, await query('.paginator'));
        res.showMoreBtn = { elem: await query('.show-more-btn') };
        res.showMoreSpinner = { elem: await query('.list-footer .request-spinner') };

        const transList = await query('.trans-list');
        assert(transList, 'List of transactions not found');
        res.transList = await TransactionList.create(this, transList);

        res.itemInfo = await TransactionDetails.create(
            this,
            await query('.transaction-details .list-item-details'),
        );

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        res.selectCategoryDialog = await SetCategoryDialog.create(
            this,
            await query(categoryDialogSelector),
        );

        return res;
    }

    getDropDownFilter(dropDown, idPrefix = null) {
        if (!dropDown) {
            return [];
        }

        const res = [];
        dropDown.getSelectedValues().forEach((id) => {
            if (idPrefix && id.startsWith(idPrefix)) {
                res.push(parseInt(id.substring(idPrefix.length), 10));
            } else if (!idPrefix) {
                res.push(parseInt(id, 10));
            }
        });
        return res;
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            contextItem: cont.contextMenu?.content?.itemId,
            listMode: (cont.transList) ? cont.transList.listMode : 'list',
            listMenuVisible: cont.listMenu?.visible,
            contextMenuVisible: cont.contextMenu?.visible,
            filtersVisible: cont.filtersContainer.visible,
            groupByDate: App.state.getGroupByDate(),
            data: App.state.transactions.clone(),
            detailsItem: this.getDetailsItem(this.getDetailsId()),
        };

        res.filter = {
            type: cont.typeMenu.value,
            accounts: this.getDropDownFilter(cont.accDropDown, 'a'),
            persons: this.getDropDownFilter(cont.accDropDown, 'p'),
            categories: this.getDropDownFilter(cont.categoryDropDown),
            search: cont.searchForm.value,
            startDate: null,
            endDate: null,
        };

        const dateRange = cont.dateFilter.getSelectedRange();
        if (dateRange?.startDate) {
            const startDate = new Date(App.parseDate(dateRange.startDate));
            res.filter.startDate = dateToSeconds(startDate);
        }
        if (dateRange?.endDate) {
            const endDate = new Date(App.parseDate(dateRange.endDate));
            res.filter.endDate = dateToSeconds(endDate);
        }

        res.filtered = res.data.applyFilter(res.filter);

        if (cont.paginator && cont.transList) {
            const items = cont.transList.getItems();
            const range = (items.length > 0)
                ? Math.ceil(items.length / App.config.transactionsOnPage)
                : 1;

            res.list = {
                page: cont.paginator.active - range + 1,
                pages: cont.paginator.pages,
                items,
                range,
            };

            res.renderTime = cont.transList.content.renderTime;
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

        res.categoryDialog = {
            show: !!(cont.selectCategoryDialog?.visible),
            categoryId: cont.selectCategoryDialog?.value,
            items: cont.selectCategoryDialog?.items.map((item) => item.id),
        };

        res.isLoadingMore = cont.showMoreSpinner.visible;
        res.loading = (cont.loadingIndicator.visible || res.isLoadingMore);

        return res;
    }

    hasDetailsModeParam(url) {
        return url?.searchParams?.get('mode') === 'details';
    }

    cloneModel(model) {
        const res = structuredClone(model);

        res.data = model.data.clone();
        res.filtered = model.filtered.clone();

        return res;
    }

    getItems() {
        return this.content.transList.getItems();
    }

    getSelectedItems(model = this.model) {
        return model.list.items.filter((item) => item.selected);
    }

    updateTransactions() {
        this.model.data = App.state.transactions.clone();
        this.model = this.updateModelFilter(this.model);
    }

    updateModelFilter(model) {
        const res = this.cloneModel(model);
        const range = 1;

        res.filtered = res.data.applyFilter(res.filter);
        if (res.filtered.length > 0) {
            const onPage = App.config.transactionsOnPage;
            const pageItems = res.filtered.getPage(1, onPage, range, true);
            const { items } = TransactionList.render(pageItems.data, App.state);

            res.list = {
                page: 1,
                pages: res.filtered.expectedPages(),
                items,
                range,
            };
        } else {
            res.list = {
                page: 0,
                pages: 0,
                items: [],
                range,
            };
        }

        return res;
    }

    onFilterUpdate() {
        this.model = this.updateModelFilter(this.model);
        return this.getExpectedState();
    }

    getDetailsId() {
        const viewPath = '/transactions/';
        const { pathname } = new URL(this.location);
        assert(pathname.startsWith(viewPath), `Invalid location path: ${pathname}`);

        if (pathname.length === viewPath.length) {
            return 0;
        }

        const param = pathname.substring(viewPath.length);
        return parseInt(param, 10) ?? 0;
    }

    getDetailsItem(itemId) {
        return App.state.transactions.getItem(itemId);
    }

    getDetailsURL(model = this.model) {
        let res = `${baseUrl()}transactions/`;

        if (model.detailsItem) {
            res += model.detailsItem.id.toString();
        }

        return res;
    }

    getExpectedURL(model = this.model) {
        const res = new URL(`${baseUrl()}transactions/`);
        const params = {};

        if (model.filter.type.length > 0) {
            params.type = model.filter.type;
        }

        if (model.filter.accounts.length > 0) {
            params.accounts = model.filter.accounts;
        }

        if (model.filter.persons.length > 0) {
            params.persons = model.filter.persons;
        }

        if (model.filter.categories.length > 0) {
            params.categories = model.filter.categories;
        }

        if (model.filter.search.length > 0) {
            params.search = model.filter.search;
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

        Object.entries(params).forEach(([prop, value]) => {
            if (Array.isArray(value)) {
                const arrProp = `${prop}[]`;
                value.forEach((item) => res.searchParams.append(arrProp, item));
            } else {
                res.searchParams.set(prop, value);
            }
        });

        return res.toString();
    }

    getExpectedCategory(index, model = this.model) {
        const indexes = asArray(index);
        assert(indexes.length > 0, 'Not transactions specified');

        if (indexes.length > 1) {
            return 0;
        }

        const [ind] = indexes;
        assert.arrayIndex(model.list.items, ind, `Invalid index of item: ${ind}`);
        const { id } = model.list.items[ind];
        const transaction = App.state.transactions.getItem(id);
        assert(transaction, `Transaction not found: '${id}'`);

        return transaction.category_id;
    }

    setModelPage(model, page) {
        assert(page >= 1 && page <= model.list.pages, `Invalid page number ${page}`);

        const res = this.cloneModel(model);
        const onPage = App.config.transactionsOnPage;
        const range = 1;

        res.filtered = res.data.applyFilter(res.filter);
        res.list.page = page;
        res.list.range = range;
        const pageItems = res.filtered.getPage(page, onPage, range, true);
        const { items } = TransactionList.render(pageItems.data, App.state);
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

        res.filtered = res.data.applyFilter(res.filter);
        res.list.range = range;
        const pageItems = res.filtered.getPage(model.list.page, onPage, range, true);
        const { items } = TransactionList.render(pageItems.data, App.state);
        res.list.items = items;

        return res;
    }

    onRangeChanged(range) {
        this.model = this.setModelRange(this.model, range);
        return this.getExpectedState();
    }

    getAccountPrefixedIds(model = this.model) {
        return model.filter.accounts.map((id) => `a${id}`);
    }

    getPersonPrefixedIds(model = this.model) {
        return model.filter.persons.map((id) => `p${id}`);
    }

    getPrefixedIds(model = this.model) {
        return [
            ...this.getAccountPrefixedIds(model),
            ...this.getPersonPrefixedIds(model),
        ];
    }

    getExpectedList(model = this.model) {
        const onPage = App.config.transactionsOnPage;
        const { page, range } = model.list;

        let items = [];
        if (page !== 0) {
            const pageItems = model.filtered.getPage(page, onPage, range, true);
            items = pageItems.data;
        }

        const showDate = !App.state.getGroupByDate();
        return TransactionList.render(items, App.state, showDate);
    }

    getExpectedState(model = this.model) {
        const listMode = model.listMode === 'list';
        const selectMode = model.listMode === 'select';
        const sortMode = model.listMode === 'sort';
        const isItemsAvailable = (model.filtered.length > 0);
        const isAvailable = App.state.accounts.length > 0 || App.state.persons.length > 0;
        const { filtersVisible } = model;
        const selected = this.getSelectedItems(model);
        const showSelectItems = (
            isItemsAvailable
            && model.listMenuVisible
            && selectMode
        );
        const pageNum = this.currentPage(model);
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

        const res = {
            typeMenu: {
                value: model.filter.type,
                visible: filtersVisible,
            },
            accDropDown: {
                visible: filtersVisible && isAvailable,
            },
            categoryDropDown: {
                visible: filtersVisible && isAvailable,
            },
            dateFilter: {
                visible: filtersVisible,
                value: {
                    startDate: startDateFmt,
                    endDate: endDateFmt,
                },
            },
            weekRangeBtn: { visible: filtersVisible },
            monthRangeBtn: { visible: filtersVisible },
            halfYearRangeBtn: { visible: filtersVisible },
            searchForm: {
                value: model.filter.search,
                visible: filtersVisible,
            },
            totalCounter: { visible: true, value: model.filtered.length },
            selectedCounter: { visible: selectMode, value: selected.length },
            modeSelector: { visible: isItemsAvailable },
            showMoreBtn: {
                visible: isItemsAvailable && pageNum < model.list.pages && !model.isLoadingMore,
            },
            showMoreSpinner: { visible: model.isLoadingMore },
            paginator: { visible: isItemsAvailable },
            transList: {
                ...list,
                visible: true,
            },
            createBtn: { visible: listMode },
            listModeBtn: { visible: !listMode },
            menuBtn: { visible: isItemsAvailable && !sortMode },
        };

        if (model.detailsItem) {
            res.itemInfo = TransactionDetails.render(model.detailsItem, App.state);
            res.itemInfo.visible = true;
        }

        if (model.listMenuVisible) {
            res.listMenu = {
                visible: model.listMenuVisible,
                selectModeBtn: {
                    visible: listMode && isItemsAvailable,
                },
                sortModeBtn: {
                    visible: listMode && model.list.items.length > 1,
                },
                selectAllBtn: {
                    visible: showSelectItems && selected.length < model.list.items.length,
                },
                deselectAllBtn: {
                    visible: showSelectItems && selected.length > 0,
                },
                exportBtn: { visible: isItemsAvailable },
                setCategoryBtn: { visible: showSelectItems && selected.length > 0 },
                deleteBtn: { visible: showSelectItems && selected.length > 0 },
                groupByDateBtn: { visible: listMode },
            };
        }

        if (model.contextMenuVisible) {
            const ctxTransaction = model.filtered.getItem(model.contextItem);
            assert(ctxTransaction, 'Invalid state');

            res.contextMenu = {
                visible: model.contextMenuVisible,
                itemId: model.contextItem,
                ctxDetailsBtn: { visible: true },
                ctxUpdateBtn: { visible: true },
                ctxSetCategoryBtn: { visible: true },
                ctxDeleteBtn: { visible: true },
            };
        }

        if (isAvailable) {
            res.accDropDown.isMulti = true;
            const ids = this.getPrefixedIds(model);
            res.accDropDown.selectedItems = ids.map((id) => ({ id }));

            res.categoryDropDown.selectedItems = model.filter.categories.map(
                (id) => ({ id: id.toString() }),
            );
        }

        if (isItemsAvailable) {
            if (model.groupByDate) {
                const { page, range } = model.list;
                const onPage = App.config.transactionsOnPage;
                const pageItems = model.filtered.getPage(page, onPage, range, true);
                const dateGroups = model.filtered.getDateGroups(pageItems);
                res.transList.groups = dateGroups.map((item) => ({
                    id: item.id,
                    title: App.formatDate(secondsToDate(item.date)),
                }));
            }

            res.paginator = {
                ...res.paginator,
                pages: model.list.pages,
                active: pageNum,
            };

            res.modeSelector.title = (model.detailsMode)
                ? __('transactions.showMain', model.locale)
                : __('transactions.showDetails', model.locale);
        }

        // Set category dialog
        if (model.categoryDialog.show) {
            res.selectCategoryDialog = {
                visible: true,
                categorySelect: {
                    visible: true,
                    items: model.categoryDialog.items,
                    value: model.categoryDialog.categoryId.toString(),
                },
            };
        }

        return res;
    }

    async openContextMenu(num) {
        await this.setListMode();

        assert.arrayIndex(this.model.list.items, num, 'Invalid transaction index');

        const item = this.content.transList.items[num];
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
        } else if (listMode === 'sort') {
            await this.performAction(() => this.listMenu.select('sortModeBtn'));
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
            type: [],
            accounts: [],
            persons: [],
            categories: [],
            search: '',
        };
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => click(this.content.clearFiltersBtn.elem));
        }

        return App.view.checkState(expected);
    }

    async filterByType(value, directNavigate = false) {
        const newTypeSel = asArray(value);
        const types = (newTypeSel.includes(0)) ? [] : newTypeSel;
        types.sort();

        if (this.content.typeMenu.isSameSelected(types)) {
            return true;
        }

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        this.model.filter.type = types;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else if (types.length === 0) {
            await this.waitForList(() => App.view.content.typeMenu.selectItemByIndex(0));
        } else if (types.length === 1) {
            const [type] = types;
            await this.waitForList(() => App.view.content.typeMenu.select(type));
        } else {
            await this.waitForList(() => App.view.content.typeMenu.selectItemByIndex(0));
            for (const type of newTypeSel) {
                await this.waitForList(() => App.view.content.typeMenu.toggle(type));
            }
        }

        return App.view.checkState(expected);
    }

    async setFilterSelection(dropDown, itemIds) {
        assert(this.content[dropDown], 'Invalid component');

        const ids = asArray(itemIds);
        const selection = this.content[dropDown].getSelectedValues();
        if (selection.length > 0) {
            await this.waitForList(() => this.content[dropDown].clearSelection());
        }
        if (ids.length === 0) {
            return;
        }

        for (const id of ids) {
            await this.waitForList(() => this.content[dropDown].selectItem(id));
        }

        await this.performAction(() => this.content[dropDown].showList(false));
    }

    async setAccountsFilterSelection(itemIds) {
        return this.setFilterSelection('accDropDown', itemIds);
    }

    async filterByAccounts(ids, directNavigate = false) {
        assert(App.state.accounts.length > 0, 'No accounts available');

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        const accounts = asArray(ids);
        this.model.filter.accounts = accounts;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            const selection = this.getPrefixedIds();
            await this.setAccountsFilterSelection(selection);
        }

        return App.view.checkState(expected);
    }

    async filterByPersons(ids, directNavigate = false) {
        assert(App.state.persons.length > 0, 'No persons available');

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        const persons = asArray(ids);
        this.model.filter.persons = persons;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            const selection = this.getPrefixedIds();
            await this.setAccountsFilterSelection(selection);
        }

        return App.view.checkState(expected);
    }

    async filterByCategories(ids, directNavigate = false) {
        assert(App.state.categories.length > 0, 'No categories available');

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        const categories = asArray(ids);
        this.model.filter.categories = categories;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.setFilterSelection('categoryDropDown', categories);
        }

        return App.view.checkState(expected);
    }

    async selectWeekRangeFilter(directNavigate = false) {
        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        const { filter } = this.model;
        const startDate = dateToSeconds(App.dates.weekAgo);
        const endDate = dateToSeconds(App.dates.now);
        if (filter.startDate === startDate && filter.endDate === endDate) {
            return true;
        }

        filter.startDate = startDate;
        filter.endDate = endDate;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            assert(this.content.weekRangeBtn.visible, 'Week range button not visible');
            await this.waitForList(() => click(this.content.weekRangeBtn.elem));
        }

        return App.view.checkState(expected);
    }

    async selectMonthRangeFilter(directNavigate = false) {
        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        const { filter } = this.model;
        const startDate = dateToSeconds(App.dates.monthAgo);
        const endDate = dateToSeconds(App.dates.now);
        if (filter.startDate === startDate && filter.endDate === endDate) {
            return true;
        }

        filter.startDate = startDate;
        filter.endDate = endDate;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            assert(this.content.monthRangeBtn.visible, 'Month range button not visible');
            await this.waitForList(() => click(this.content.monthRangeBtn.elem));
        }

        return App.view.checkState(expected);
    }

    async selectHalfYearRangeFilter(directNavigate = false) {
        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        const { filter } = this.model;
        const startDate = dateToSeconds(shiftMonth(App.dates.now, -6));
        const endDate = dateToSeconds(App.dates.now);
        if (filter.startDate === startDate && filter.endDate === endDate) {
            return true;
        }

        filter.startDate = startDate;
        filter.endDate = endDate;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            assert(this.content.halfYearRangeBtn.visible, 'Half a year range button not visible');
            await this.waitForList(() => click(this.content.halfYearRangeBtn.elem));
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
            await goTo(this.getExpectedURL());
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
            await goTo(this.getExpectedURL());
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
            await goTo(this.getExpectedURL());
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
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.dateFilter.clearEnd());
        }

        return App.view.checkState(expected);
    }

    async search(text, directNavigate = false) {
        if (this.model.filter.search === text) {
            return true;
        }

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        this.model.filter.search = text;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForSearch(() => this.content.searchForm.input(text), text);
        }

        return App.view.checkState(expected);
    }

    async clearSearch(directNavigate = false) {
        if (this.model.filter.search === '') {
            return true;
        }

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        this.model.filter.search = '';
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.searchForm.clear());
        }

        return App.view.checkState(expected);
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

    async waitForSearch(action, searchQuery) {
        await this.parse();

        const prevTime = this.model.renderTime;

        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.loading
                && prevTime !== this.model.renderTime
                && searchQuery === this.model.filter.search
            );
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

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.closeFilters();
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

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.closeFilters();
        }
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

        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.closeFilters();
        }
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

        await this.closeFilters();

        const expected = this.onRangeChanged(this.currentRange() + 1);

        await this.waitForList(() => click(this.content.showMoreBtn.elem));

        return this.checkState(expected);
    }

    async iteratePages() {
        const res = {
            items: [],
            pages: [],
        };

        if (!this.content.transList) {
            return res;
        }

        await this.closeFilters();
        if (!this.isFirstPage()) {
            await this.goToFirstPage();
        }

        let pos = this.pagesCount() * App.config.transactionsOnPage;
        while (this.content.transList.items.length) {
            const curPos = pos;
            const pageItems = this.content.transList.items.map((item, ind) => ({
                id: item.content.id,
                accountTitle: item.content.accountTitle,
                amountText: item.content.amountText,
                dateFmt: item.content.dateFmt,
                comment: item.content.comment,
                pos: curPos - ind,
            }));
            pos -= pageItems.length;

            res.pages.push(pageItems);
            res.items.push(...pageItems);

            if (this.isLastPage()) {
                break;
            }

            await this.goToNextPage();
        }

        return res;
    }

    /** Click on add button */
    async goToCreateTransaction() {
        await navigation(() => this.content.createBtn.click());
    }

    async selectTransactions(data) {
        assert.isDefined(data, 'No transactions specified');
        assert(this.content.transList, 'No transactions available to select');

        await this.setSelectMode();

        const transactions = asArray(data);
        for (const num of transactions) {
            assert.arrayIndex(this.content.transList.items, num);

            const item = this.model.list.items[num];
            item.selected = !item.selected;
            const expected = this.getExpectedState();

            await this.performAction(() => this.content.transList.items[num].click());

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

        await this.performAction(() => this.listMenu.select('selectAllBtn'));

        return this.checkState(expected);
    }

    async deselectAll() {
        assert(this.model.listMode === 'select', 'Invalid state');

        const deselectItem = (item) => ({ ...item, selected: false });

        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.list.items = this.model.list.items.map(deselectItem);
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

        const item = this.content.transList.items[num];
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
            await goTo(this.getDetailsURL());
        } else {
            await this.performAction(() => this.content.itemInfo.close());
        }

        return App.view.checkState(expected);
    }

    /** Select specified transaction, click on edit button */
    async goToUpdateTransaction(num) {
        await this.openContextMenu(num);

        return navigation(() => this.contextMenu.select('ctxUpdateBtn'));
    }

    /** Export transactions of specified accounts */
    async exportTransactions() {
        await this.openListMenu();

        const exportBtn = this.listMenu.findItemById('exportBtn');
        const downloadURL = exportBtn.link;
        assert(downloadURL, 'Invalid export URL');

        const exportResp = await httpReq('GET', downloadURL);
        assert(exportResp?.status === 200, 'Invalid response');

        await this.closeListMenu();

        return exportResp.body;
    }

    // Check all transactions have same type, otherwise show only categories with type 'Any'
    getTypeOfSelected(ids) {
        return asArray(ids).reduce((currentType, id) => {
            const transaction = App.state.transactions.getItem(id);
            assert(transaction, `Transaction '${id}' not found`);

            if (currentType === null) {
                return transaction.type;
            }

            return (currentType === transaction.type) ? currentType : 0;
        }, null);
    }

    /** Select category for specified transaction */
    async setTransactionCategory(index, category) {
        await this.openContextMenu(index);

        const type = this.getTypeOfSelected(this.model.contextItem);

        this.model.categoryDialog = {
            show: true,
            categoryId: this.getExpectedCategory(index),
            items: App.state
                .getCategoriesForType(type)
                .map((item) => ({ id: item.id.toString() })),
        };
        this.model.contextMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.contextMenu.select('ctxSetCategoryBtn'));
        await this.performAction(() => wait(categoryDialogSelector, { visible: true }));

        this.checkState(expected);

        assert(this.content.selectCategoryDialog, 'Select category dialog not found');

        await this.waitForList(() => (
            this.content.selectCategoryDialog.selectCategoryAndSubmit(category)
        ));
    }

    /** Set category for selected transactions */
    async setCategory(data, category) {
        const transactions = asArray(data);
        assert(transactions.length > 0, 'Not transactions specified');

        await this.selectTransactions(transactions);

        await this.openListMenu();

        const selected = this.getSelectedItems().map((item) => item.id);
        const type = this.getTypeOfSelected(selected);

        this.model.listMenuVisible = false;
        this.model.categoryDialog = {
            show: true,
            categoryId: this.getExpectedCategory(transactions),
            items: App.state
                .getCategoriesForType(type)
                .map((item) => ({ id: item.id.toString() })),
        };
        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('setCategoryBtn'));
        await this.performAction(() => wait(categoryDialogSelector, { visible: true }));

        this.checkState(expected);

        assert(this.content.selectCategoryDialog, 'Select category dialog not found');

        await this.waitForList(() => (
            this.content.selectCategoryDialog.selectCategoryAndSubmit(category)
        ));
    }

    /** Delete secified transaction from context menu */
    async deleteFromContextMenu(index) {
        await this.openContextMenu(index);

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        const expected = this.getExpectedState();

        await this.performAction(() => this.contextMenu.select('ctxDeleteBtn'));

        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete transaction warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }

    /** Delete specified transactions */
    async deleteTransactions(data) {
        assert(data, 'No transactions specified');

        const transactions = asArray(data);
        await this.selectTransactions(transactions);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('deleteBtn'));
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete transaction warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }

    /** Toggle enables/disables group transactions by date */
    async toggleGroupByDate() {
        await this.setListMode();
        await this.openListMenu();

        this.model.groupByDate = !this.model.groupByDate;
        this.model.listMenuVisible = false;

        App.state.updateSettings({
            tr_group_by_date: (this.model.groupByDate) ? 1 : 0,
        });

        const expected = this.getExpectedState();

        await this.waitForList(() => this.listMenu.select('groupByDateBtn'));
        this.checkState(expected);

        return App.state.fetchAndTest();
    }
}
