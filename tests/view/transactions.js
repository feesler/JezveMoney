import { TestView } from './testview.js';
import { App } from '../app.js';
import { DropDown } from './component/dropdown.js';
import { IconLink } from './component/iconlink.js';
import { WarningPopup } from './component/warningpopup.js';
import { TransactionTypeMenu } from './component/transactiontypemenu.js';
import { DatePickerFilter } from './component/datefilter.js';
import { Paginator } from './component/paginator.js';
import { ModeSelector } from './component/modeselector.js';
import { SearchForm } from './component/searchform.js';
import { TransactionList } from './component/transactionlist.js';
import { copyObject, fixDate, setParam } from '../common.js';
import { Toolbar } from './component/toolbar.js';
import { Component } from './component/component.js';

/** List of transactions view class */
export class TransactionsView extends TestView {
    async parseContent() {
        const res = {
            titleEl: await this.query('.content_wrap > .heading > h1'),
            addBtn: await IconLink.create(this, await this.query('#add_btn')),
            toolbar: await Toolbar.create(this, await this.query('#toolbar')),
        };

        if (
            !res.titleEl
            || !res.addBtn
            || !res.toolbar
            || !res.toolbar.editBtn
            || !res.toolbar.delBtn
        ) {
            throw new Error('Invalid structure of transactions view');
        }

        res.typeMenu = await TransactionTypeMenu.create(this, await this.query('.trtype-menu'));
        if (!res.typeMenu) {
            throw new Error('Search form not found');
        }

        res.accDropDown = await DropDown.createFromChild(this, await this.query('#acc_id'));
        if (!res.accDropDown) {
            throw new Error('Account filter control not found');
        }

        const calendarBtn = await this.query('#calendar_btn');
        res.dateFilter = await DatePickerFilter.create(this, await this.parentNode(calendarBtn));
        if (!res.dateFilter) {
            throw new Error('Date filter not found');
        }

        res.searchForm = await SearchForm.create(this, await this.query('#searchFrm'));
        if (!res.searchForm) {
            throw new Error('Search form not found');
        }

        const transList = await this.query('.trans-list');
        if (!transList) {
            throw new Error('List of transactions not found');
        }

        res.modeSelector = await ModeSelector.create(this, await this.query(transList, '.mode-selector'));
        res.paginator = await Paginator.create(this, await this.query(transList, '.paginator'));

        res.title = await this.prop(res.titleEl, 'textContent');
        res.transList = await TransactionList.create(this, await this.query('#tritems'));

        if (
            res.transList
            && res.transList.items
            && res.transList.items.length
            && !res.modeSelector
        ) {
            throw new Error('Mode selector not found');
        }
        if (
            res.transList
            && res.transList.items
            && res.transList.items.length
            && !res.paginator
        ) {
            throw new Error('Paginator not found');
        }

        res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

        return res;
    }

    async buildModel(cont) {
        const res = {};

        res.data = App.state.transactions.clone();

        res.filter = {
            type: cont.typeMenu.getSelectedTypes(),
            accounts: cont.accDropDown.getSelectedValues().map((item) => parseInt(item, 10)),
            search: cont.searchForm.value,
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
                pages: cont.paginator.getPages(),
                items: cont.transList.getItems(),
            };
        } else {
            res.list = {
                page: 0,
                pages: 0,
                items: [],
            };
        }

        if (cont.modeSelector) {
            res.detailsMode = cont.modeSelector.details;
        } else {
            const locURL = new URL(this.location);
            res.detailsMode = locURL.searchParams.has('mode') && locURL.searchParams.get('mode') === 'details';
        }

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

    setModelPage(model, page) {
        if (page < 1 || page > model.list.pages) {
            throw new Error(`Invalid page number ${page}`);
        }

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

    setExpectedState() {
        const isItemsAvailable = (this.model.filtered.length > 0);

        const res = {
            visibility: {
                typeMenu: true,
                accDropDown: true,
                searchForm: true,
                modeSelector: isItemsAvailable,
                paginator: isItemsAvailable,
                transList: isItemsAvailable,
            },
            values: {
                typeMenu: { selectedTypes: this.model.filter.type },
                searchForm: { value: this.model.filter.search },
            },
        };

        if (isItemsAvailable) {
            setParam(res.values, {
                paginator: {
                    pages: this.model.list.pages,
                    active: this.model.list.page,
                },
                modeSelector: {
                    details: this.model.detailsMode,
                },
            });
        }

        return res;
    }

    async filterByAccounts(accounts) {
        this.model.filter.accounts = accounts;
        const expected = this.onFilterUpdate();

        await this.navigation(() => this.content.accDropDown.setSelection(accounts));

        return App.view.checkState(expected);
    }

    async selectDateRange(start, end) {
        this.model.filter.startDate = start;
        this.model.filter.endDate = end;
        const expected = this.onFilterUpdate();

        const startDate = new Date(fixDate(start));
        const endDate = new Date(fixDate(end));

        await this.navigation(() => this.content.dateFilter.selectRange(startDate, endDate));

        return App.view.checkState(expected);
    }

    async search(text) {
        this.model.filter.search = text;
        const expected = this.onFilterUpdate();

        await this.navigation(() => this.content.searchForm.search(text));

        return App.view.checkState(expected);
    }

    async setClassicMode() {
        if (!this.content.modeSelector) {
            return false;
        }
        if (this.content.modeSelector.listMode.isActive) {
            return false;
        }

        this.model.detailsMode = false;
        const expected = this.setExpectedState();

        await this.navigation(() => this.content.modeSelector.setClassicMode());

        return App.view.checkState(expected);
    }

    async setDetailsMode() {
        if (!this.content.modeSelector) {
            return false;
        }
        if (this.content.modeSelector.detailsMode.isActive) {
            return false;
        }

        this.model.detailsMode = true;
        const expected = this.setExpectedState();

        await this.navigation(() => this.content.modeSelector.setDetailsMode());

        return App.view.checkState(expected);
    }

    currentPage() {
        return (this.content.paginator) ? this.content.paginator.active : 1;
    }

    pagesCount() {
        if (
            this.content.paginator
            && this.content.paginator.items
            && this.content.paginator.items.length
        ) {
            return this.content.paginator.items.length;
        }
        return 1;
    }

    isFirstPage() {
        return !this.content.paginator || this.content.paginator.isFirstPage();
    }

    isLastPage() {
        return !this.content.paginator || this.content.paginator.isLastPage();
    }

    async goToFirstPage() {
        if (this.isFirstPage()) {
            return this;
        }

        const expected = this.onPageChanged(1);

        await this.navigation(() => this.content.paginator.goToFirstPage());

        return App.view.checkState(expected);
    }

    async goToLastPage() {
        if (this.isLastPage()) {
            return true;
        }

        const expected = this.onPageChanged(this.pagesCount());

        await this.navigation(() => this.content.paginator.goToLastPage());

        return App.view.checkState(expected);
    }

    async goToPrevPage() {
        if (this.isFirstPage()) {
            throw new Error('Can\'t go to previous page');
        }

        const expected = this.onPageChanged(this.currentPage() - 1);

        await this.navigation(() => this.content.paginator.goToPrevPage());

        return App.view.checkState(expected);
    }

    async goToNextPage() {
        if (this.isLastPage()) {
            throw new Error('Can\'t go to next page');
        }

        const expected = this.onPageChanged(this.currentPage() + 1);

        await this.navigation(() => this.content.paginator.goToNextPage());

        return App.view.checkState(expected);
    }

    async iteratePages() {
        const res = {
            items: [],
            pages: [],
        };

        if (!(App.view instanceof TransactionsView)) {
            throw new Error('Not expected view');
        }

        if (!App.view.content.transList) {
            return res;
        }

        if (!App.view.isFirstPage()) {
            await App.view.goToFirstPage();
        }

        let pos = App.view.pagesCount() * App.config.transactionsOnPage;
        while (App.view.content.transList.items.length) {
            const curPos = pos;
            const pageItems = App.view.content.transList.items.map((item, ind) => ({
                id: item.id,
                accountTitle: item.accountTitle,
                amountText: item.amountText,
                dateFmt: item.dateFmt,
                comment: item.comment,
                pos: curPos - ind,
            }));
            pos -= pageItems.length;

            res.pages.push(pageItems);
            res.items.push(...pageItems);

            if (App.view.isLastPage()) {
                break;
            }

            await App.view.goToNextPage();
        }

        return res;
    }

    async filterByType(type) {
        const newTypeSel = Array.isArray(type) ? type : [type];
        newTypeSel.sort();

        if (this.content.typeMenu.isSameSelected(newTypeSel)) {
            return true;
        }

        this.model.filter.type = newTypeSel;
        const expected = this.onFilterUpdate();

        if (newTypeSel.length === 1) {
            await this.navigation(() => this.content.typeMenu.select(newTypeSel[0]));
        } else {
            await this.navigation(() => this.content.typeMenu.select(0));
            for (const typeItem of newTypeSel) {
                await App.view.navigation(() => App.view.content.typeMenu.toggle(typeItem));
            }
        }

        return App.view.checkState(expected);
    }

    /** Click on add button */
    async goToCreateTransaction() {
        await this.navigation(() => this.content.addBtn.click());
    }

    async selectTransactions(data) {
        if (typeof data === 'undefined') {
            throw new Error('No transactions specified');
        }

        const transactions = Array.isArray(data) ? data : [data];

        if (!this.content.transList) {
            throw new Error('No transactions available to select');
        }

        const selectedItems = this.getSelectedItems();
        let selectedCount = selectedItems.length;
        for (const num of transactions) {
            if (num < 0 || num >= this.content.transList.items.length) {
                throw new Error('Wrong transaction number');
            }

            const isSelected = this.content.transList.items[num].selected;
            await this.performAction(() => this.content.transList.items[num].click());
            selectedCount += (isSelected ? -1 : 1);

            const updIsVisible = await this.content.toolbar.isButtonVisible('update');
            if ((selectedCount === 1) !== updIsVisible) {
                throw new Error(`Unexpected visibility (${updIsVisible}) of Update button while ${selectedCount} items selected`);
            }

            const delIsVisible = await this.content.toolbar.isButtonVisible('del');
            if ((selectedCount > 0) !== delIsVisible) {
                throw new Error(`Unexpected visibility (${delIsVisible}) of Delete button while ${selectedCount} items selected`);
            }
        }
    }

    /** Select specified transaction, click on edit button */
    async goToUpdateTransaction(num) {
        const pos = parseInt(num, 10);
        if (Number.isNaN(pos)) {
            throw new Error('Invalid position of transaction');
        }

        await this.selectTransactions(pos);

        return this.navigation(() => this.content.toolbar.clickButton('update'));
    }

    /** Delete specified transactions */
    async deleteTransactions(data) {
        if (!data) {
            throw new Error('No transactions specified');
        }

        const transactions = Array.isArray(data) ? data : [data];
        await this.selectTransactions(transactions);

        await this.performAction(() => this.content.toolbar.clickButton('del'));

        if (!await Component.isVisible(this.content.delete_warning)) {
            throw new Error('Delete transaction warning popup not appear');
        }
        if (!this.content.delete_warning.okBtn) {
            throw new Error('OK button not found');
        }

        await this.navigation(() => this.click(this.content.delete_warning.okBtn));
    }
}
