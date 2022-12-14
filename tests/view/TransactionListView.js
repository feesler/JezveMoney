import {
    assert,
    asArray,
    asyncMap,
    query,
    prop,
    navigation,
    click,
    waitForFunction,
    goTo,
    baseUrl,
    copyObject,
    isVisible,
    closest,
} from 'jezve-test';
import {
    DropDown,
    Paginator,
    IconButton,
} from 'jezvejs-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { WarningPopup } from './component/WarningPopup.js';
import { DatePickerFilter } from './component/DatePickerFilter.js';
import { TransactionTypeMenu } from './component/LinkMenu/TransactionTypeMenu.js';
import { SearchInput } from './component/SearchInput.js';
import { TransactionList } from './component/TransactionList/TransactionList.js';
import { fixDate, isEmpty, urlJoin } from '../common.js';
import { Counter } from './component/Counter.js';

const modeButtons = {
    list: 'listModeBtn',
    select: 'selectModeBtn',
    sort: 'sortModeBtn',
};

const listMenuItems = [
    'selectModeBtn',
    'sortModeBtn',
    'selectAllBtn',
    'deselectAllBtn',
    'setCategoryBtn',
    'deleteBtn',
];

const contextMenuItems = [
    'ctxUpdateBtn', 'ctxDeleteBtn',
];

const TITLE_SHOW_MAIN = 'Show main';
const TITLE_SHOW_DETAILS = 'Show details';

/** List of transactions view class */
export class TransactionListView extends AppView {
    get accDropDown() {
        return this.content.accDropDown;
    }

    get categoryDropDown() {
        return this.content.categoryDropDown;
    }

    async parseContent() {
        const res = {
            title: { elem: await query('.content_wrap > .heading > h1') },
            createBtn: await IconButton.create(this, await query('#createBtn')),
            filtersBtn: await IconButton.create(this, await query('#filtersBtn')),
            filtersContainer: { elem: await query('#filtersContainer') },
            clearFiltersBtn: { elem: await query('#clearFiltersBtn') },
            closeFiltersBtn: { elem: await query('#closeFiltersBtn') },
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
        const contextParent = await closest(res.contextMenu.elem, '.trans-item');
        if (contextParent) {
            const itemId = await prop(contextParent, 'dataset.id');
            res.contextMenu.itemId = parseInt(itemId, 10);
            assert(res.contextMenu.itemId, 'Invalid item');

            await this.parseMenuItems(res, contextMenuItems);
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

        res.searchForm = await SearchInput.create(this, await query('#searchFilter .search-field'));
        assert(res.searchForm, 'Search form not found');

        const listContainer = await query('.list-container');
        assert(listContainer, 'List container not found');
        res.loadingIndicator = { elem: await query(listContainer, '.loading-indicator') };

        res.modeSelector = await IconButton.create(this, await query('.mode-selector'));
        res.paginator = await Paginator.create(this, await query('.paginator'));
        res.showMoreBtn = { elem: await query('.show-more-btn') };

        res.title.value = await prop(res.title.elem, 'textContent');

        const transList = await query('.trans-list');
        assert(transList, 'List of transactions not found');
        res.transList = await TransactionList.create(this, transList);

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        const categoryDialogElem = await query('#selectCategoryDialog');
        res.selectCategoryDialog = { elem: categoryDialogElem };
        if (categoryDialogElem) {
            const dropDownElem = await query(categoryDialogElem, '.dd__container');
            res.selectCategoryDialog.categorySelect = await DropDown.create(this, dropDownElem);

            res.selectCategoryDialog.okBtn = await query(
                categoryDialogElem,
                '.popup__controls .btn.submit-btn',
            );
            res.selectCategoryDialog.cancelBtn = await query(
                categoryDialogElem,
                '.popup__controls .btn.cancel-btn',
            );
        }

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
            contextItem: cont.contextMenu.itemId,
            listMode: (cont.transList) ? cont.transList.listMode : 'list',
            listMenuVisible: cont.listMenu.visible,
            contextMenuVisible: cont.contextMenu.visible,
            filtersVisible: cont.filtersContainer.visible,
            data: App.state.transactions.clone(),
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
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            res.filter.startDate = dateRange.startDate;
            res.filter.endDate = dateRange.endDate;
        }

        res.filtered = res.data.applyFilter(res.filter);

        if (cont.paginator && cont.transList) {
            const items = cont.transList.getItems();
            const range = Math.ceil(items.length / App.config.transactionsOnPage);
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

        const isModeSelectorVisible = cont.modeSelector?.content?.visible;
        if (isModeSelectorVisible) {
            res.detailsMode = cont.modeSelector.title === TITLE_SHOW_MAIN;
        } else {
            const locURL = new URL(this.location);
            res.detailsMode = locURL.searchParams.has('mode') && locURL.searchParams.get('mode') === 'details';
        }

        res.loading = cont.loadingIndicator.visible;

        return res;
    }

    cloneModel(model) {
        const res = copyObject(model);

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

    updateModelFilter(model) {
        const res = this.cloneModel(model);

        res.filtered = res.data.applyFilter(res.filter);

        const pageItems = res.filtered.getPage(1);
        if (res.filtered.length > 0) {
            res.list = {
                page: 1,
                pages: res.filtered.expectedPages(),
                items: TransactionList.render(pageItems.data, App.state),
                range: 1,
            };
        } else {
            res.list = {
                page: 0,
                pages: 0,
                items: [],
                range: 1,
            };
        }

        return res;
    }

    onFilterUpdate() {
        this.model = this.updateModelFilter(this.model);
        return this.getExpectedState();
    }

    getExpectedURL() {
        let res = `${baseUrl()}transactions/`;
        const params = {};

        if (this.model.filter.type.length > 0) {
            params.type = this.model.filter.type;
        }

        if (this.model.filter.accounts.length > 0) {
            params.acc_id = this.model.filter.accounts;
        }

        if (this.model.filter.persons.length > 0) {
            params.person_id = this.model.filter.persons;
        }

        if (this.model.filter.categories.length > 0) {
            params.category_id = this.model.filter.categories;
        }

        if (this.model.filter.search.length > 0) {
            params.search = this.model.filter.search;
        }

        if (this.model.filter.startDate && this.model.filter.endDate) {
            params.stdate = this.model.filter.startDate;
            params.enddate = this.model.filter.endDate;
        }

        if (this.model.list.page !== 0) {
            params.page = this.model.list.page;
        }

        if (this.model.detailsMode) {
            params.mode = 'details';
        }

        if (!isEmpty(params)) {
            res += `?${urlJoin(params)}`;
        }

        return res;
    }

    setModelPage(model, page) {
        assert(page >= 1 && page <= model.list.pages, `Invalid page number ${page}`);

        const res = this.cloneModel(model);

        res.filtered = res.data.applyFilter(res.filter);
        res.list.page = page;
        res.list.range = 1;
        const pageItems = res.filtered.getPage(page);
        res.list.items = TransactionList.render(pageItems.data, App.state);

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
        const pageItems = res.filtered.getPage(model.list.page, onPage, range);
        res.list.items = TransactionList.render(pageItems.data, App.state);

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

    getExpectedState(model = this.model) {
        const listMode = model.listMode === 'list';
        const selectMode = model.listMode === 'select';
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
                    startDate: model.filter.startDate,
                    endDate: model.filter.endDate,
                },
            },
            searchForm: {
                value: model.filter.search,
                visible: filtersVisible,
            },
            totalCounter: { visible: true, value: model.filtered.length },
            selectedCounter: { visible: selectMode, value: selected.length },
            modeSelector: { visible: isItemsAvailable },
            showMoreBtn: { visible: isItemsAvailable && pageNum < model.list.pages },
            paginator: { visible: isItemsAvailable },
            transList: { visible: true },
            createBtn: { visible: listMode },
            listModeBtn: { visible: !listMode },
            listMenuContainer: { visible: isItemsAvailable },
            listMenu: { visible: model.listMenuVisible },
            selectModeBtn: {
                visible: model.listMenuVisible && listMode && isItemsAvailable,
            },
            sortModeBtn: {
                visible: model.listMenuVisible && listMode && model.list.items.length > 1,
            },
            selectAllBtn: {
                visible: showSelectItems && selected.length < model.list.items.length,
            },
            deselectAllBtn: {
                visible: showSelectItems && selected.length > 0,
            },
            setCategoryBtn: { visible: showSelectItems && selected.length > 0 },
            deleteBtn: { visible: showSelectItems && selected.length > 0 },
        };

        if (model.contextMenuVisible) {
            const ctxTransaction = model.filtered.getItem(model.contextItem);
            assert(ctxTransaction, 'Invalid state');

            res.contextMenu = {
                visible: true,
                itemId: model.contextItem,
            };

            res.ctxUpdateBtn = { visible: true };
            res.ctxDeleteBtn = { visible: true };
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
            res.paginator = {
                ...res.paginator,
                pages: model.list.pages,
                active: pageNum,
            };

            res.modeSelector.title = (model.detailsMode) ? TITLE_SHOW_MAIN : TITLE_SHOW_DETAILS;
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

        await this.performAction(() => item.clickMenu());
        assert(this.content.contextMenu.visible, 'Context menu not visible');

        return this.checkState(expected);
    }

    async openListMenu() {
        assert(!this.content.listMenu.visible, 'List menu already opened');

        await this.closeFilters();

        this.model.listMenuVisible = true;
        const expected = this.getExpectedState();

        await this.performAction(() => click(this.content.listMenuContainer.menuBtn));

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

        if (listMode === 'list') {
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

    async selectDateRange(start, end, directNavigate = false) {
        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        this.model.filter.startDate = start;
        this.model.filter.endDate = end;
        const expected = this.onFilterUpdate();

        const startDate = new Date(fixDate(start));
        const endDate = new Date(fixDate(end));

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.dateFilter.selectRange(startDate, endDate));
        }

        return App.view.checkState(expected);
    }

    async clearDateRange(directNavigate = false) {
        if (directNavigate) {
            this.model.filtersVisible = false;
        } else {
            await this.openFilters();
        }

        this.model.filter.startDate = null;
        this.model.filter.endDate = null;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.dateFilter.clear());
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
            return this;
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

    /** Select specified transaction, click on edit button */
    async goToUpdateTransaction(num) {
        await this.openContextMenu(num);

        return navigation(() => this.content.ctxUpdateBtn.click());
    }

    /** Set category for selected transactions */
    async setCategory(data, category) {
        const transactions = asArray(data);
        assert(transactions.length > 0, 'Not transactions specified');

        await this.selectTransactions(transactions);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.setCategoryBtn.click());
        this.checkState(expected);

        const { selectCategoryDialog } = this.content;
        assert(selectCategoryDialog?.visible, 'Select category dialog not appear');
        assert(selectCategoryDialog.okBtn, 'OK button not found');

        const { categorySelect } = selectCategoryDialog;
        await this.waitForList(async () => {
            await categorySelect.setSelection(category);
            await click(selectCategoryDialog.okBtn);
        });
    }

    /** Delete specified transactions */
    async deleteTransactions(data) {
        assert(data, 'No transactions specified');

        const transactions = asArray(data);
        await this.selectTransactions(transactions);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deleteBtn.click());
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete transaction warning popup not appear');
        assert(this.content.delete_warning.content.okBtn, 'OK button not found');

        await this.waitForList(() => click(this.content.delete_warning.content.okBtn));
    }
}
