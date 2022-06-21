import {
    assert,
    query,
    prop,
    parentNode,
    navigation,
    isVisible,
    click,
    waitForFunction,
    goTo,
    baseUrl,
} from 'jezve-test';
import { copyObject, urlJoin, isEmpty } from 'jezvejs';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { DropDown } from './component/DropDown.js';
import { IconLink } from './component/IconLink.js';
import { WarningPopup } from './component/WarningPopup.js';
import { TransactionTypeMenu } from './component/TransactionTypeMenu.js';
import { DatePickerFilter } from './component/DatePickerFilter.js';
import { Paginator } from './component/Paginator.js';
import { ModeSelector } from './component/TransactionList/ModeSelector.js';
import { SearchForm } from './component/TransactionList/SearchForm.js';
import { TransactionList } from './component/TransactionList/TransactionList.js';
import { fixDate } from '../common.js';
import { Toolbar } from './component/Toolbar.js';
import { FiltersAccordion } from './component/TransactionList/FiltersAccordion.js';

/** List of transactions view class */
export class TransactionsView extends AppView {
    async parseContent() {
        const res = {
            titleEl: await query('.content_wrap > .heading > h1'),
            addBtn: await IconLink.create(this, await query('#add_btn')),
            toolbar: await Toolbar.create(this, await query('#toolbar')),
        };

        assert(
            res.titleEl
            && res.addBtn
            && res.toolbar
            && res.toolbar.content.editBtn
            && res.toolbar.content.delBtn,
            'Invalid structure of transactions view',
        );

        res.filtersAccordion = await FiltersAccordion.create(this, await query('.filters-collapsible'));
        assert(res.filtersAccordion, 'Filters not found');

        res.typeMenu = await TransactionTypeMenu.create(this, await query('.trtype-menu'));
        assert(res.typeMenu, 'Types menu not found');

        res.accDropDown = await DropDown.createFromChild(this, await query('#acc_id'));
        assert(res.accDropDown, 'Account filter control not found');

        res.personDropDown = await DropDown.createFromChild(this, await query('#person_id'));
        assert(res.personDropDown, 'Person filter control not found');

        const calendarBtn = await query('#calendar_btn');
        res.dateFilter = await DatePickerFilter.create(this, await parentNode(calendarBtn));
        assert(res.dateFilter, 'Date filter not found');

        res.searchForm = await SearchForm.create(this, await query('#searchFrm'));
        assert(res.searchForm, 'Search form not found');

        const transList = await query('.trans-list');
        assert(transList, 'List of transactions not found');

        res.loadingIndicator = { elem: await query(transList, '.trans-list__loading') };
        res.loadingIndicator.visible = await isVisible(res.loadingIndicator.elem, true);

        res.modeSelector = await ModeSelector.create(this, await query('.mode-selector'));
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

    async buildModel(cont) {
        const res = {};

        res.data = App.state.transactions.clone();

        res.filterCollapsed = cont.filtersAccordion.isCollapsed();
        res.filter = {
            type: cont.typeMenu.getSelectedTypes(),
            accounts: cont.accDropDown.getSelectedValues().map((item) => parseInt(item, 10)),
            persons: cont.personDropDown.getSelectedValues().map((item) => parseInt(item, 10)),
            search: cont.searchForm.content.value,
        };
        const dateRange = cont.dateFilter.getSelectedRange();
        if (dateRange && dateRange.startDate && dateRange.endDate) {
            res.filter.startDate = dateRange.startDate;
            res.filter.endDate = dateRange.endDate;
        }

        res.filtered = res.data.applyFilter(res.filter);

        if (cont.paginator && cont.transList) {
            res.list = {
                page: cont.paginator.content.active,
                pages: cont.paginator.getPages(),
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
            res.detailsMode = cont.modeSelector.content.details;
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

    getSelectedItems() {
        return this.content.transList.getSelectedItems();
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
        const isFiltersVisible = !model.filterCollapsed;

        const res = {
            typeMenu: {
                selectedTypes: model.filter.type,
                visible: isFiltersVisible,
            },
            accDropDown: {
                isMulti: true,
                visible: isFiltersVisible,
                selectedItems: model.filter.accounts.map(
                    (accountId) => ({ id: accountId.toString() }),
                ),
            },
            personDropDown: {
                isMulti: true,
                visible: isFiltersVisible,
                selectedItems: model.filter.persons.map(
                    (personId) => ({ id: personId.toString() }),
                ),
            },
            searchForm: {
                value: model.filter.search,
                visible: isFiltersVisible,
            },
            modeSelector: { visible: isItemsAvailable },
            paginator: { visible: isItemsAvailable },
            transList: { visible: true },
        };

        if (isItemsAvailable) {
            res.paginator = {
                ...res.paginator,
                pages: model.list.pages,
                active: model.list.page,
            };

            res.modeSelector = {
                ...res.modeSelector,
                details: model.detailsMode,
            };
        }

        return res;
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

    async filterByType(type, directNavigate = false) {
        const newTypeSel = Array.isArray(type) ? type : [type];
        newTypeSel.sort();

        if (this.content.typeMenu.isSameSelected(newTypeSel)) {
            return true;
        }

        if (directNavigate) {
            this.model.filterCollapsed = true;
        } else {
            await this.openFilters();
        }

        this.model.filter.type = newTypeSel;
        const expected = this.onFilterUpdate();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else if (newTypeSel.length === 1) {
            await this.waitForList(() => App.view.content.typeMenu.select(newTypeSel[0]));
        } else {
            await this.waitForList(() => App.view.content.typeMenu.select(0));
            for (const typeItem of newTypeSel) {
                await this.waitForList(() => App.view.content.typeMenu.toggle(typeItem));
            }
        }

        return App.view.checkState(expected);
    }

    async filterByAccounts(accounts, directNavigate = false) {
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
            await this.waitForList(() => this.content.accDropDown.setSelection(accounts));
        }

        return App.view.checkState(expected);
    }

    async filterByPersons(persons, directNavigate = false) {
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
            await this.waitForList(() => this.content.personDropDown.setSelection(persons));
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
            await this.waitForList(() => this.content.searchForm.search(text));
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
        if (this.content.modeSelector.content.listMode.isActive) {
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
            await this.waitForList(() => this.content.modeSelector.setClassicMode());
        }

        return App.view.checkState(expected);
    }

    async setDetailsMode(directNavigate = false) {
        if (!this.content.modeSelector) {
            return false;
        }
        if (this.content.modeSelector.content.detailsMode.isActive) {
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
            await this.waitForList(() => this.content.modeSelector.setDetailsMode());
        }

        return App.view.checkState(expected);
    }

    currentPage() {
        return (this.content.paginator) ? this.content.paginator.content.active : 1;
    }

    pagesCount() {
        if (
            this.content.paginator
            && this.content.paginator.content.items
            && this.content.paginator.content.items.length
        ) {
            return this.content.paginator.content.items.length;
        }
        return 1;
    }

    isFirstPage() {
        return !this.content.paginator || this.content.paginator.isFirstPage();
    }

    isLastPage() {
        return !this.content.paginator || this.content.paginator.isLastPage();
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
        while (this.content.transList.content.items.length) {
            const curPos = pos;
            const pageItems = this.content.transList.content.items.map((item, ind) => ({
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
        assert(typeof data !== 'undefined', 'No transactions specified');

        const transactions = Array.isArray(data) ? data : [data];

        assert(this.content.transList, 'No transactions available to select');

        const selectedItems = this.getSelectedItems();
        let selectedCount = selectedItems.length;
        for (const num of transactions) {
            assert.arrayIndex(this.content.transList.content.items, num);

            const isSelected = this.content.transList.content.items[num].content.selected;
            await this.performAction(() => this.content.transList.content.items[num].click());
            selectedCount += (isSelected ? -1 : 1);

            const updIsVisible = this.content.toolbar.isButtonVisible('update');
            assert(
                (selectedCount === 1) === updIsVisible,
                `Unexpected visibility (${updIsVisible}) of Update button while ${selectedCount} items selected`,
            );

            const delIsVisible = this.content.toolbar.isButtonVisible('del');
            assert(
                (selectedCount > 0) === delIsVisible,
                `Unexpected visibility (${delIsVisible}) of Delete button while ${selectedCount} items selected`,
            );
        }
    }

    /** Select specified transaction, click on edit button */
    async goToUpdateTransaction(num) {
        const pos = parseInt(num, 10);
        assert(!Number.isNaN(pos), 'Invalid position of transaction');

        await this.selectTransactions(pos);

        return navigation(() => this.content.toolbar.clickButton('update'));
    }

    /** Delete specified transactions */
    async deleteTransactions(data) {
        assert(data, 'No transactions specified');

        const transactions = Array.isArray(data) ? data : [data];
        await this.selectTransactions(transactions);

        await this.performAction(() => this.content.toolbar.clickButton('del'));

        assert(this.content.delete_warning?.content?.visible, 'Delete transaction warning popup not appear');
        assert(this.content.delete_warning.content.okBtn, 'OK button not found');

        await navigation(() => click(this.content.delete_warning.content.okBtn));
    }
}
