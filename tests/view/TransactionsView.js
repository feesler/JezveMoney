import { copyObject } from 'jezvejs';
import { TestComponent } from 'jezve-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { DropDown } from './component/DropDown.js';
import { IconLink } from './component/IconLink.js';
import { WarningPopup } from './component/WarningPopup.js';
import { TransactionTypeMenu } from './component/TransactionTypeMenu.js';
import { DatePickerFilter } from './component/DatePickerFilter.js';
import { Paginator } from './component/Paginator.js';
import { ModeSelector } from './component/ModeSelector.js';
import { SearchForm } from './component/SearchForm.js';
import { TransactionList } from './component/TransactionList.js';
import { fixDate } from '../common.js';
import { Toolbar } from './component/Toolbar.js';
import {
    query,
    prop,
    parentNode,
    navigation,
    isVisible,
    click,
    waitForFunction,
} from '../env.js';

/** List of transactions view class */
export class TransactionsView extends AppView {
    async parseContent() {
        const res = {
            titleEl: await query('.content_wrap > .heading > h1'),
            addBtn: await IconLink.create(this, await query('#add_btn')),
            importBtn: await IconLink.create(this, await query('#import_btn')),
            toolbar: await Toolbar.create(this, await query('#toolbar')),
        };

        if (
            !res.titleEl
            || !res.addBtn
            || !res.toolbar
            || !res.toolbar.content.editBtn
            || !res.toolbar.content.delBtn
        ) {
            throw new Error('Invalid structure of transactions view');
        }

        res.typeMenu = await TransactionTypeMenu.create(this, await query('.trtype-menu'));
        if (!res.typeMenu) {
            throw new Error('Search form not found');
        }

        res.accDropDown = await DropDown.createFromChild(this, await query('#acc_id'));
        if (!res.accDropDown) {
            throw new Error('Account filter control not found');
        }

        const calendarBtn = await query('#calendar_btn');
        res.dateFilter = await DatePickerFilter.create(this, await parentNode(calendarBtn));
        if (!res.dateFilter) {
            throw new Error('Date filter not found');
        }

        res.searchForm = await SearchForm.create(this, await query('#searchFrm'));
        if (!res.searchForm) {
            throw new Error('Search form not found');
        }

        const transList = await query('.trans-list');
        if (!transList) {
            throw new Error('List of transactions not found');
        }

        res.loadingIndicator = { elem: await query(transList, '.trans-list__loading') };
        res.loadingIndicator.visible = await isVisible(res.loadingIndicator.elem, true);

        res.modeSelector = await ModeSelector.create(this, await query('.mode-selector'));
        res.paginator = await Paginator.create(this, await query('.paginator'));

        res.title = await prop(res.titleEl, 'textContent');
        res.transList = await TransactionList.create(this, transList);

        if (
            res.transList
            && res.transList.content.items
            && res.transList.content.items.length
            && !res.modeSelector
        ) {
            throw new Error('Mode selector not found');
        }
        if (
            res.transList
            && res.transList.content.items
            && res.transList.content.items.length
            && !res.paginator
        ) {
            throw new Error('Paginator not found');
        }

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    async buildModel(cont) {
        const res = {};

        res.data = App.state.transactions.clone();

        res.filter = {
            type: cont.typeMenu.getSelectedTypes(),
            accounts: cont.accDropDown.getSelectedValues().map((item) => parseInt(item, 10)),
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

        const isModeSelectorVisible = await TestComponent.isVisible(cont.modeSelector);
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
                transList: true,
            },
            values: {
                typeMenu: { selectedTypes: this.model.filter.type },
                searchForm: { value: this.model.filter.search },
            },
        };

        if (isItemsAvailable) {
            Object.assign(res.values, {
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

        await this.waitForList(() => this.content.accDropDown.setSelection(accounts));

        return this.checkState(expected);
    }

    async selectDateRange(start, end) {
        this.model.filter.startDate = start;
        this.model.filter.endDate = end;
        const expected = this.onFilterUpdate();

        const startDate = new Date(fixDate(start));
        const endDate = new Date(fixDate(end));

        await this.waitForList(() => this.content.dateFilter.selectRange(startDate, endDate));

        return this.checkState(expected);
    }

    async clearDateRange() {
        this.model.filter.startDate = null;
        this.model.filter.endDate = null;
        const expected = this.onFilterUpdate();

        await this.waitForList(() => this.content.dateFilter.clear());

        return this.checkState(expected);
    }

    async search(text) {
        this.model.filter.search = text;
        const expected = this.onFilterUpdate();

        await this.waitForList(() => this.content.searchForm.search(text));

        return this.checkState(expected);
    }

    async clearSearch() {
        this.model.filter.search = '';
        const expected = this.onFilterUpdate();

        await this.waitForList(() => this.content.searchForm.clear());

        return this.checkState(expected);
    }

    async setClassicMode() {
        if (!this.content.modeSelector) {
            return false;
        }
        if (this.content.modeSelector.content.listMode.isActive) {
            return false;
        }

        this.model.detailsMode = false;
        const expected = this.setExpectedState();

        await this.waitForList(() => this.content.modeSelector.setClassicMode());

        return App.view.checkState(expected);
    }

    async setDetailsMode() {
        if (!this.content.modeSelector) {
            return false;
        }
        if (this.content.modeSelector.content.detailsMode.isActive) {
            return false;
        }

        this.model.detailsMode = true;
        const expected = this.setExpectedState();

        await this.waitForList(() => this.content.modeSelector.setDetailsMode());

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

    async goToFirstPage() {
        if (this.isFirstPage()) {
            return this;
        }

        const expected = this.onPageChanged(1);

        await this.waitForList(() => this.content.paginator.goToFirstPage());

        return this.checkState(expected);
    }

    async goToLastPage() {
        if (this.isLastPage()) {
            return true;
        }

        const expected = this.onPageChanged(this.pagesCount());

        await this.waitForList(() => this.content.paginator.goToLastPage());

        return this.checkState(expected);
    }

    async goToPrevPage() {
        if (this.isFirstPage()) {
            throw new Error('Can\'t go to previous page');
        }

        const expected = this.onPageChanged(this.currentPage() - 1);

        await this.waitForList(() => this.content.paginator.goToPrevPage());

        return this.checkState(expected);
    }

    async goToNextPage() {
        if (this.isLastPage()) {
            throw new Error('Can\'t go to next page');
        }

        const expected = this.onPageChanged(this.currentPage() + 1);

        await this.waitForList(() => this.content.paginator.goToNextPage());

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

    async filterByType(type) {
        const newTypeSel = Array.isArray(type) ? type : [type];
        newTypeSel.sort();

        if (this.content.typeMenu.isSameSelected(newTypeSel)) {
            return true;
        }

        this.model.filter.type = newTypeSel;
        const expected = this.onFilterUpdate();

        if (newTypeSel.length === 1) {
            await this.waitForList(() => App.view.content.typeMenu.select(newTypeSel[0]));
        } else {
            await this.waitForList(() => App.view.content.typeMenu.select(0));
            for (const typeItem of newTypeSel) {
                await this.waitForList(() => App.view.content.typeMenu.toggle(typeItem));
            }
        }

        return this.checkState(expected);
    }

    /** Click on add button */
    async goToCreateTransaction() {
        await navigation(() => this.content.addBtn.click());
    }

    /** Click on import button */
    async goToImportView() {
        await navigation(() => this.content.importBtn.click());
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
            if (num < 0 || num >= this.content.transList.content.items.length) {
                throw new Error('Wrong transaction number');
            }

            const isSelected = this.content.transList.content.items[num].content.selected;
            await this.performAction(() => this.content.transList.content.items[num].click());
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

        return navigation(() => this.content.toolbar.clickButton('update'));
    }

    /** Delete specified transactions */
    async deleteTransactions(data) {
        if (!data) {
            throw new Error('No transactions specified');
        }

        const transactions = Array.isArray(data) ? data : [data];
        await this.selectTransactions(transactions);

        await this.performAction(() => this.content.toolbar.clickButton('del'));

        if (!await TestComponent.isVisible(this.content.delete_warning)) {
            throw new Error('Delete transaction warning popup not appear');
        }
        if (!this.content.delete_warning.content.okBtn) {
            throw new Error('OK button not found');
        }

        await navigation(() => click(this.content.delete_warning.content.okBtn));
    }
}
