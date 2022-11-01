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
import { DropDown, Paginator } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { IconButton } from './component/IconButton.js';
import { WarningPopup } from './component/WarningPopup.js';
import { DatePickerFilter } from './component/DatePickerFilter.js';
import { LinkMenu } from './component/LinkMenu/LinkMenu.js';
import { TransactionTypeMenu } from './component/LinkMenu/TransactionTypeMenu.js';
import { SearchForm } from './component/TransactionList/SearchForm.js';
import { TransactionList } from './component/TransactionList/TransactionList.js';
import { fixDate, isEmpty, urlJoin } from '../common.js';
import { FiltersAccordion } from './component/TransactionList/FiltersAccordion.js';

const listMenuItems = [
    'selectModeBtn',
    'selectAllBtn',
    'deselectAllBtn',
    'deleteBtn',
];

const contextMenuItems = [
    'ctxUpdateBtn', 'ctxDeleteBtn',
];

const contextMenuId = '#contextMenu';

/** List of transactions view class */
export class TransactionListView extends AppView {
    async parseContent() {
        const res = {
            titleEl: await query('.content_wrap > .heading > h1'),
            addBtn: await IconButton.create(this, await query('#add_btn')),
            listMenuContainer: {
                elem: await query('#listMenu'),
                menuBtn: await query('#listMenu .actions-menu-btn'),
            },
            listMenu: { elem: await query('#listMenu .actions-menu-list') },
            contextMenu: { elem: await query(contextMenuId) },
        };

        await this.parseMenuItems(res, listMenuItems);

        assert(
            res.titleEl
            && res.addBtn
            && res.listMenuContainer.elem
            && res.listMenuContainer.menuBtn
            && res.listMenu.elem,
            'Invalid structure of transactions view',
        );

        const contextParent = await closest(res.contextMenu.elem, '.trans-item');
        if (contextParent) {
            const itemId = await prop(contextParent, 'dataset.id');
            res.contextMenu.itemId = parseInt(itemId, 10);
            assert(res.contextMenu.itemId, 'Invalid item');

            await this.parseMenuItems(res, contextMenuItems);
        }

        res.filtersAccordion = await FiltersAccordion.create(this, await query('.filters-collapsible'));
        assert(res.filtersAccordion, 'Filters not found');

        res.typeMenu = await TransactionTypeMenu.create(this, await query('.trtype-menu'));
        assert(res.typeMenu, 'Types menu not found');

        const accountsFilter = await query('#accountsFilter');
        const accountsFilterVisible = await isVisible(accountsFilter);
        if (accountsFilterVisible) {
            res.accDropDown = await DropDown.createFromChild(this, await query('#acc_id'));
        }

        const personsFilter = await query('#personsFilter');
        const personsFilterVisible = await isVisible(personsFilter);
        if (personsFilterVisible) {
            res.personDropDown = await DropDown.createFromChild(this, await query('#person_id'));
        }

        res.dateFilter = await DatePickerFilter.create(this, await query('#dateFilter'));
        assert(res.dateFilter, 'Date filter not found');

        res.searchForm = await SearchForm.create(this, await query('#searchFrm'));
        assert(res.searchForm, 'Search form not found');

        const transList = await query('.trans-list');
        assert(transList, 'List of transactions not found');

        res.loadingIndicator = { elem: await query(transList, '.loading-indicator') };

        res.modeSelector = await LinkMenu.create(this, await query('.mode-selector'));
        res.paginator = await Paginator.create(this, await query('.paginator'));

        res.title = await prop(res.titleEl, 'textContent');
        res.transList = await TransactionList.create(this, transList);

        if (res.transList?.content?.items?.length > 0) {
            assert(res.modeSelector, 'Mode selector not found');
            assert(res.paginator, 'Paginator not found');
        }

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

    getDropDownFilter(dropDown) {
        return (dropDown)
            ? dropDown.getSelectedValues().map((item) => parseInt(item, 10))
            : [];
    }

    async buildModel(cont) {
        const res = {
            contextItem: cont.contextMenu.itemId,
            mode: this.getViewMode(cont),
            listMenuVisible: cont.listMenu.visible,
            contextMenuVisible: cont.contextMenu.visible,
        };

        res.data = App.state.transactions.clone();

        res.filterCollapsed = cont.filtersAccordion.isCollapsed();
        res.filter = {
            type: cont.typeMenu.value,
            accounts: this.getDropDownFilter(cont.accDropDown),
            persons: this.getDropDownFilter(cont.personDropDown),
            search: cont.searchForm.content.value,
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
            res.list = {
                page: cont.paginator.active,
                pages: cont.paginator.pages,
                items: cont.transList.getItems(),
            };
            res.renderTime = cont.transList.content.renderTime;
        } else {
            res.list = {
                page: 0,
                pages: 0,
                items: [],
            };
        }

        const isModeSelectorVisible = cont.modeSelector?.content?.visible;
        if (isModeSelectorVisible) {
            res.detailsMode = cont.modeSelector.value === 'details';
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
            };
        } else {
            res.list = {
                page: 0,
                pages: 0,
                items: [],
            };
        }

        return res;
    }

    onFilterUpdate() {
        this.model = this.updateModelFilter(this.model);
        return this.setExpectedState();
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
        const pageItems = res.filtered.getPage(page);
        res.list.items = TransactionList.render(pageItems.data, App.state);

        return res;
    }

    onPageChanged(page) {
        this.model = this.setModelPage(this.model, page);
        return this.setExpectedState();
    }

    setExpectedState(model = this.model) {
        const isItemsAvailable = (model.filtered.length > 0);
        const isAccountsAvailable = App.state.accounts.length > 0;
        const isPersonsAvailable = App.state.persons.length > 0;
        const isFiltersVisible = !model.filterCollapsed;
        const selected = this.getSelectedItems(model);

        const showSelectItems = (
            isItemsAvailable
            && model.listMenuVisible
            && model.mode === 'select'
        );

        const res = {
            typeMenu: {
                value: model.filter.type,
                visible: isFiltersVisible,
            },
            accDropDown: {
                visible: isFiltersVisible && isAccountsAvailable,
            },
            personDropDown: {
                visible: isFiltersVisible && isPersonsAvailable,
            },
            dateFilter: {
                visible: isFiltersVisible,
                value: {
                    startDate: model.filter.startDate,
                    endDate: model.filter.endDate,
                },
            },
            searchForm: {
                value: model.filter.search,
                visible: isFiltersVisible,
            },
            modeSelector: { visible: isItemsAvailable },
            paginator: { visible: isItemsAvailable },
            transList: { visible: true },
            listMenuContainer: { visible: isItemsAvailable },
            listMenu: { visible: model.listMenuVisible },
            selectModeBtn: { visible: model.listMenuVisible },
            selectAllBtn: {
                visible: showSelectItems && selected.length < model.list.items.length,
            },
            deselectAllBtn: {
                visible: showSelectItems && selected.length > 0,
            },
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

        if (isAccountsAvailable) {
            res.accDropDown.isMulti = true;
            res.accDropDown.selectedItems = model.filter.accounts.map(
                (accountId) => ({ id: accountId.toString() }),
            );
        }

        if (isPersonsAvailable) {
            res.personDropDown.isMulti = true;
            res.personDropDown.selectedItems = model.filter.persons.map(
                (personId) => ({ id: personId.toString() }),
            );
        }

        if (isItemsAvailable) {
            res.paginator = {
                ...res.paginator,
                pages: model.list.pages,
                active: model.list.page,
            };

            res.modeSelector = {
                ...res.modeSelector,
                value: (model.detailsMode) ? 'details' : 'classic',
            };
        }

        return res;
    }

    async openContextMenu(num) {
        await this.cancelSelectMode();

        assert.arrayIndex(this.model.list.items, num, 'Invalid transaction index');

        const item = this.content.transList.items[num];
        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.setExpectedState();

        await this.performAction(() => item.clickMenu());
        assert(this.content.contextMenu.visible, 'Context menu not visible');

        return this.checkState(expected);
    }

    async openListMenu() {
        assert(!this.content.listMenu.visible, 'List menu already opened');

        this.model.listMenuVisible = true;
        const expected = this.setExpectedState();

        await this.performAction(() => click(this.content.listMenuContainer.menuBtn));

        return this.checkState(expected);
    }

    async toggleSelectMode() {
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.mode = (this.model.mode === 'select') ? 'list' : 'select';
        const expected = this.setExpectedState();

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

    async openFilters() {
        if (!this.content.filtersAccordion.isCollapsed()) {
            return true;
        }

        this.model.filterCollapsed = false;
        const expected = this.setExpectedState();

        await this.performAction(() => this.content.filtersAccordion.toggle());

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
            search: '',
        };
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.filtersAccordion.clearAll());
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
            this.model.filterCollapsed = true;
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

    async setFilterSelection(dropDown, ids) {
        const selection = this.content[dropDown].getSelectedValues();
        if (selection.length === 0 && ids.length === 0) {
            return;
        }

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

    async filterByAccounts(accounts, directNavigate = false) {
        assert(App.state.accounts.length > 0, 'No accounts available');

        if (directNavigate) {
            this.model.filterCollapsed = true;
        } else {
            await this.openFilters();
        }

        this.model.filter.accounts = accounts;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.setFilterSelection('accDropDown', accounts);
        }

        return App.view.checkState(expected);
    }

    async filterByPersons(persons, directNavigate = false) {
        assert(App.state.persons.length > 0, 'No persons available');

        if (directNavigate) {
            this.model.filterCollapsed = true;
        } else {
            await this.openFilters();
        }

        this.model.filter.persons = persons;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.setFilterSelection('personDropDown', persons);
        }

        return App.view.checkState(expected);
    }

    async selectDateRange(start, end, directNavigate = false) {
        if (directNavigate) {
            this.model.filterCollapsed = true;
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
            this.model.filterCollapsed = true;
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
        if (directNavigate) {
            this.model.filterCollapsed = true;
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
        if (directNavigate) {
            this.model.filterCollapsed = true;
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

    async setClassicMode(directNavigate = false) {
        if (!this.content.modeSelector) {
            return false;
        }
        if (this.content.modeSelector.value === 'classic') {
            return false;
        }

        if (directNavigate) {
            this.model.filterCollapsed = true;
        }
        this.model.detailsMode = false;
        const expected = this.setExpectedState();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.modeSelector.selectItemByValue('classic'));
        }

        return App.view.checkState(expected);
    }

    async setDetailsMode(directNavigate = false) {
        if (!this.content.modeSelector) {
            return false;
        }
        if (this.content.modeSelector.value === 'details') {
            return false;
        }

        if (directNavigate) {
            this.model.filterCollapsed = true;
        }
        this.model.detailsMode = true;
        const expected = this.setExpectedState();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.modeSelector.selectItemByValue('details'));
        }

        return App.view.checkState(expected);
    }

    currentPage() {
        return (this.content.paginator) ? this.content.paginator.active : 1;
    }

    pagesCount() {
        return (this.content.paginator) ? this.content.paginator.pages : 1;
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
            this.model.filterCollapsed = true;
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
            this.model.filterCollapsed = true;
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
            this.model.filterCollapsed = true;
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
            this.model.filterCollapsed = true;
        }
        const expected = this.onPageChanged(this.currentPage() + 1);

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.waitForList(() => this.content.paginator.goToNextPage());
        }

        return App.view.checkState(expected);
    }

    async iteratePages() {
        const res = {
            items: [],
            pages: [],
        };

        if (!this.content.transList) {
            return res;
        }

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
        await navigation(() => this.content.addBtn.click());
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
            const expected = this.setExpectedState();

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
        const expected = this.setExpectedState();

        await this.performAction(() => this.content.selectAllBtn.click());

        return this.checkState(expected);
    }

    async deselectAll() {
        assert(this.model.mode === 'select', 'Invalid state');

        const deselectItem = (item) => ({ ...item, selected: false });

        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.list.items = this.model.list.items.map(deselectItem);
        const expected = this.setExpectedState();

        await this.performAction(() => this.content.deselectAllBtn.click());

        return this.checkState(expected);
    }

    /** Select specified transaction, click on edit button */
    async goToUpdateTransaction(num) {
        await this.openContextMenu(num);

        return navigation(() => this.content.ctxUpdateBtn.click());
    }

    /** Delete specified transactions */
    async deleteTransactions(data) {
        assert(data, 'No transactions specified');

        const transactions = Array.isArray(data) ? data : [data];
        await this.selectTransactions(transactions);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.setExpectedState();

        await this.performAction(() => this.content.deleteBtn.click());
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete transaction warning popup not appear');
        assert(this.content.delete_warning.content.okBtn, 'OK button not found');

        await this.waitForList(() => click(this.content.delete_warning.content.okBtn));
    }
}
