import 'jezvejs/style';
import { asArray } from '@jezvejs/types';
import { insertAfter, createElement } from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { Paginator } from 'jezvejs/Paginator';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { Spinner } from 'jezvejs/Spinner';
import { createStore } from 'jezvejs/Store';

// Application
import {
    __,
    cutDate,
    dateStringToTime,
    formatDateRange,
    getApplicationURL,
    getContextIds,
    getSelectedItems,
    timeToDate,
} from '../../utils/utils.js';
import { MAX_PRECISION, normalize } from '../../utils/decimal.js';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { API } from '../../API/index.js';
import { AppView } from '../../Components/Layout/AppView/AppView.js';

// Models
import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';

// Common components
import { ExportDialog } from '../../Components/Transaction/ExportDialog/ExportDialog.js';
import { FiltersContainer } from '../../Components/List/FiltersContainer/FiltersContainer.js';
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { ListCounter } from '../../Components/List/ListCounter/ListCounter.js';
import { LoadingIndicator } from '../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { ConfirmDialog } from '../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { TransactionList } from '../../Components/Transaction/TransactionList/TransactionList.js';
import { TransactionListGroup } from '../../Components/Transaction/TransactionListGroup/TransactionListGroup.js';
import { TransactionListItem } from '../../Components/Transaction/TransactionListItem/TransactionListItem.js';
import { SetCategoryDialog } from '../../Components/Category/SetCategoryDialog/SetCategoryDialog.js';
import { ToggleDetailsButton } from '../../Components/List/ToggleDetailsButton/ToggleDetailsButton.js';
import { TransactionListContextMenu } from '../../Components/Transaction/TransactionListContextMenu/TransactionListContextMenu.js';
import { TransactionFilters } from '../../Components/Transaction/Filters/TransactionFilters.js';

// Local components
import { TransactionListMainMenu } from './components/MainMenu/TransactionListMainMenu.js';
import { TransactionDetails } from './components/TransactionDetails/TransactionDetails.js';

import { reducer, actions } from './reducer.js';
import {
    deleteItems,
    sendChangePosRequest,
    setItemsCategory,
    setListData,
    setListMode,
} from './actions.js';
import {
    getTransactionsGroupByDate,
    isSameSelection,
} from './helpers.js';
import './TransactionListView.scss';

/**
 * List of transactions view
 */
class TransactionListView extends AppView {
    constructor(...args) {
        super(...args);

        const { filter } = this.props;

        const initialState = {
            ...this.props,
            form: {
                ...filter,
                ...formatDateRange(filter),
            },
            loading: false,
            isLoadingMore: false,
            listMode: 'list',
            groupByDate: getTransactionsGroupByDate() === 1,
            showMenu: false,
            showContextMenu: false,
            contextItem: null,
            selDateRange: null,
            showCategoryDialog: false,
            categoryDialog: {
                categoryId: 0,
                type: 0,
            },
            showDeleteConfirmDialog: false,
            showExportDialog: false,
            exportFilter: null,
            renderTime: Date.now(),
        };

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(AccountList, 'accounts', App.props.accounts);
        App.loadModel(PersonList, 'persons', App.props.persons);
        App.loadModel(CategoryList, 'categories', App.props.categories);
        App.initCategoriesModel();

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'heading',
            'contentHeader',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('transactions.listTitle'),
        });

        // Transaction details
        this.itemInfo = Offcanvas.create({
            placement: 'right',
            className: 'transaction-details',
            onClosed: () => this.closeDetails(),
        });

        // Filters
        this.filtersBtn = Button.create({
            id: 'filtersBtn',
            className: 'circle-btn',
            icon: 'filter',
            onClick: () => this.onToggleFilters(),
        });
        this.createBtn = Button.create({
            id: 'createBtn',
            type: 'link',
            className: 'circle-btn',
            icon: 'plus',
            url: `${App.baseURL}transactions/create/`,
        });
        this.heading.actionsContainer.append(this.filtersBtn.elem, this.createBtn.elem);

        this.filters = TransactionFilters.create({
            getURL: (...args) => this.getFilterURL(...args),
            onChangeTypeFilter: (value) => this.onChangeTypeFilter(value),
            onAccountChange: (selected) => this.onAccountChange(selected),
            onChangeDateRange: (range) => this.onChangeDateRange(range),
            onChangeAmountFilter: (range) => this.onChangeAmountFilter(range),
            onSearchInputChange: (value) => this.onSearchInputChange(value),
            onApplyFilters: () => this.onApplyFilters(),
            onClearAllFilters: (e) => this.onClearAllFilters(e),
        });

        this.filtersContainer = FiltersContainer.create({
            content: this.filters.elem,
        });
        this.contentHeader.prepend(this.filtersContainer.elem);

        // Loading indicator
        this.listContainer = document.querySelector('.list-container');
        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });
        this.listContainer.append(this.loadingIndicator.elem);

        // List header
        // Counters
        this.itemsCounter = ListCounter.create({
            title: __('list.itemsCounter'),
            className: 'items-counter',
        });
        this.selectedCounter = ListCounter.create({
            title: __('list.selectedItemsCounter'),
            className: 'selected-counter',
        });

        const counters = createElement('div', {
            props: { className: 'counters' },
            children: [
                this.itemsCounter.elem,
                this.selectedCounter.elem,
            ],
        });

        // Toggle details mode button
        this.modeSelector = ToggleDetailsButton.create({
            onChange: (mode) => this.onChangeMode(mode),
        });

        const listHeader = createElement('div', {
            props: { className: 'list-header' },
            children: [counters, this.modeSelector.elem],
        });

        this.contentHeader.append(listHeader);

        // Transactions list
        const listContainer = document.querySelector('.list-container');
        this.list = TransactionList.create({
            ItemComponent: () => this.getListItemComponent(),
            listMode: 'list',
            onItemClick: (id, e) => this.onItemClick(id, e),
            onSort: (info) => this.onSort(info),
        });
        listContainer.append(this.list.elem);

        const listFooter = document.querySelector('.list-footer');
        // 'Show more' button
        this.spinner = Spinner.create({ className: 'request-spinner' });
        this.spinner.hide();
        this.showMoreBtn = Button.create({
            className: 'show-more-btn',
            title: __('actions.showMore'),
            onClick: (e) => this.showMore(e),
        });
        listFooter.append(this.showMoreBtn.elem, this.spinner.elem);

        // Paginator
        this.paginator = Paginator.create({
            arrows: true,
            breakLimit: 3,
            onChange: (page) => this.onChangePage(page),
        });
        listFooter.append(this.paginator.elem);

        // 'Done' button
        this.listModeBtn = Button.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('actions.done'),
            onClick: () => this.store.dispatch(setListMode('list')),
        });
        insertAfter(this.listModeBtn.elem, this.createBtn.elem);

        this.menuButton = MenuButton.create({
            className: 'circle-btn',
            onClick: (e) => this.showMenu(e),
        });
        insertAfter(this.menuButton.elem, this.listModeBtn.elem);

        this.subscribeToStore(this.store);
    }

    getListItemComponent() {
        const state = this.store.getState();
        return (state.groupByDate) ? TransactionListGroup : TransactionListItem;
    }

    showMenu() {
        this.store.dispatch(actions.showMenu());
    }

    hideMenu() {
        this.store.dispatch(actions.hideMenu());
    }

    /** Returns true if accounts or persons is available */
    isAvailable() {
        const { accounts, persons } = App.model;
        return (accounts.length > 0 || persons.length > 0);
    }

    showDetails(e) {
        e?.preventDefault();
        this.store.dispatch(actions.showDetails());
    }

    closeDetails() {
        this.store.dispatch(actions.closeDetails());
    }

    showContextMenu(itemId) {
        this.store.dispatch(actions.showContextMenu(itemId));
    }

    hideContextMenu() {
        this.store.dispatch(actions.hideContextMenu());
    }

    toggleSelectItem(itemId) {
        this.store.dispatch(actions.toggleSelectItem(itemId));
    }

    /** Update render time */
    setRenderTime() {
        this.store.dispatch(actions.setRenderTime());
    }

    getItem(id) {
        const { items } = this.store.getState();
        const strId = id?.toString() ?? null;
        if (strId === null) {
            return null;
        }

        return items.find((item) => item.id.toString() === strId);
    }

    onSort(info) {
        const item = this.getItem(info.itemId);
        const prevItem = this.getItem(info.prevId);
        const nextItem = this.getItem(info.nextId);
        if (!prevItem && !nextItem) {
            return;
        }

        let pos = null;
        if (prevItem) {
            pos = (item.pos < prevItem.pos) ? prevItem.pos : (prevItem.pos + 1);
        } else {
            pos = nextItem.pos;
        }

        this.store.dispatch(sendChangePosRequest(item.id, pos));
    }

    /** Returns URL for filter of specified state */
    getFilterURL(state, keepPage = true) {
        const params = {
            ...state.filter,
        };

        if (keepPage) {
            params.page = state.pagination.page;
        }
        if (state.mode === 'details') {
            params.mode = 'details';
        }

        return getApplicationURL('transactions/', params);
    }

    onApplyFilters() {
        this.filtersContainer.close();
    }

    onToggleFilters() {
        this.filtersContainer.toggle();
    }

    /**
     * Clear all filters
     * @param {Event} e - click event object
     */
    onClearAllFilters(e) {
        e.preventDefault();

        this.store.dispatch(actions.clearAllFilters());
        this.requestTransactions(this.getRequestData());
    }

    /**
     * Transaction type menu change event handler
     */
    onChangeTypeFilter(selected) {
        this.store.dispatch(actions.changeTypeFilter(selected));
        this.requestTransactions(this.getRequestData());
    }

    /**
     * Account and person filter change event handler
     * @param {object} obj - selection object
     */
    onAccountChange(selected) {
        const accountIds = [];
        const personIds = [];
        const categoryIds = [];

        asArray(selected).forEach(({ id }) => {
            const itemId = parseInt(id.substring(1), 10);
            if (id.startsWith('a')) {
                accountIds.push(itemId);
            } else if (id.startsWith('p')) {
                personIds.push(itemId);
            } else if (id.startsWith('c')) {
                categoryIds.push(itemId);
            }
        });

        const state = this.store.getState();
        const filterAccounts = asArray(state.form.accounts);
        const filterPersons = asArray(state.form.persons);
        const filterCategories = asArray(state.form.categories);

        const accountsChanged = !isSameSelection(accountIds, filterAccounts);
        const personsChanged = !isSameSelection(personIds, filterPersons);
        const categoriesChanged = !isSameSelection(categoryIds, filterCategories);

        if (!accountsChanged && !personsChanged && !categoriesChanged) {
            return;
        }

        if (accountsChanged) {
            this.store.dispatch(actions.changeAccountsFilter(accountIds));
        }
        if (personsChanged) {
            this.store.dispatch(actions.changePersonsFilter(personIds));
        }
        if (categoriesChanged) {
            this.store.dispatch(actions.changeCategoriesFilter(categoryIds));
        }

        this.requestTransactions(this.getRequestData());
    }

    /** Search field input event handler */
    onSearchInputChange(value) {
        this.store.dispatch(actions.changeSearchQuery(value));
        this.requestTransactions(this.getRequestData());
    }

    onChangeCategorySelect(category) {
        this.store.dispatch(actions.changeCategorySelect(category.id));
    }

    /** Date range filter change handler */
    onChangeDateRange(data) {
        const { filter } = this.store.getState();
        const startDate = filter.startDate ?? null;
        const endDate = filter.endDate ?? null;
        const timeData = {
            startDate: dateStringToTime(data.startDate, { fixShortYear: false }),
            endDate: dateStringToTime(data.endDate, { fixShortYear: false }),
        };

        if (startDate === timeData.startDate && endDate === timeData.endDate) {
            return;
        }

        this.store.dispatch(actions.changeDateFilter(data));
        this.requestTransactions(this.getRequestData());
    }

    /** Amount range filter change handler */
    onChangeAmountFilter(data) {
        const { filter } = this.store.getState();
        const minAmount = filter.minAmount ?? null;
        const maxAmount = filter.maxAmount ?? null;
        const newRange = {
            minAmount: (data.minAmount) ? normalize(data.minAmount, MAX_PRECISION) : null,
            maxAmount: (data.maxAmount) ? normalize(data.maxAmount, MAX_PRECISION) : null,
        };

        if (
            minAmount === newRange.minAmount
            && maxAmount === newRange.maxAmount
        ) {
            return;
        }

        this.store.dispatch(actions.changeAmountFilter(data));
        this.requestTransactions(this.getRequestData());
    }

    showMore() {
        const state = this.store.getState();
        const { page } = state.pagination;
        let { range } = state.pagination;
        if (!range) {
            range = 1;
        }
        range += 1;

        this.requestTransactions({
            ...this.getRequestData(),
            range,
            page,
            keepState: true,
            isLoadingMore: true,
        });
    }

    onChangePage(page) {
        this.requestTransactions({
            ...this.getRequestData(),
            page,
        });
    }

    onChangeMode(mode) {
        const state = this.store.getState();
        if (state.mode === mode) {
            return;
        }

        this.store.dispatch(actions.toggleMode());
        this.setRenderTime();
    }

    onItemClick(itemId, e) {
        const id = parseInt(itemId, 10);
        if (!id) {
            return;
        }

        const state = this.store.getState();
        if (state.listMode === 'list') {
            const menuBtn = e?.target?.closest('.menu-btn');
            if (menuBtn) {
                this.showContextMenu(id);
            }
        } else if (state.listMode === 'select') {
            if (e?.target?.closest('.checkbox') && e.pointerType !== '') {
                e.preventDefault();
            }

            this.toggleSelectItem(id);
        }
    }

    getRequestData() {
        const { form } = this.store.getState();

        const res = {
            ...form,
            startDate: dateStringToTime(form.startDate, { fixShortYear: false }),
            endDate: dateStringToTime(form.endDate, { fixShortYear: false }),
        };

        return res;
    }

    async requestTransactions(options) {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        const { signal } = this.abortController;
        let aborted = false;
        const {
            keepState = false,
            isLoadingMore = false,
            ...request
        } = options;

        this.store.dispatch(actions.startLoading(isLoadingMore));

        try {
            const { data } = await API.transaction.list(request, { signal });

            this.store.dispatch(setListData(data, keepState));
        } catch (e) {
            aborted = e.name === 'AbortError';
            if (!aborted) {
                App.createErrorNotification(e.message);
                this.store.dispatch(actions.listRequestError());
            }
        }

        if (!aborted) {
            this.store.dispatch(actions.stopLoading());
            this.setRenderTime();
            this.abortController = null;
        }
    }

    renderDeleteConfirmDialog(state, prevState) {
        if (state.showDeleteConfirmDialog === prevState.showDeleteConfirmDialog) {
            return;
        }

        if (!state.showDeleteConfirmDialog) {
            return;
        }

        const ids = getContextIds(state);
        if (ids.length === 0) {
            return;
        }

        const multiple = (ids.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multiple) ? __('transactions.deleteMultiple') : __('transactions.delete'),
            content: (multiple) ? __('transactions.deleteMultipleMessage') : __('transactions.deleteMessage'),
            onConfirm: () => this.store.dispatch(deleteItems()),
            onReject: () => this.store.dispatch(actions.hideDeleteConfirmDialog()),
        });
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = TransactionListContextMenu.create({
                id: 'contextMenu',
                actions,
                dispatch: (action) => this.store.dispatch(action),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.contextMenu.setContext({
            showContextMenu: state.showContextMenu,
            contextItem: state.contextItem,
            showDetailsItem: true,
        });
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
        const isListMode = state.listMode === 'list';
        const isSortMode = state.listMode === 'sort';

        this.createBtn.show(isListMode);
        this.listModeBtn.show(!isListMode);
        this.menuButton.show(itemsCount > 0 && !isSortMode);

        if (!state.showMenu && !this.menu) {
            return;
        }

        const showFirstTime = !this.menu;
        if (!this.menu) {
            this.menu = TransactionListMainMenu.create({
                id: 'listMenu',
                attachTo: this.menuButton.elem,
                dispatch: (action) => this.store.dispatch(action),
                onClose: () => this.hideMenu(),
            });
        }

        this.menu.setContext({
            listMode: state.listMode,
            showMenu: state.showMenu,
            items: state.items,
            filter: state.filter,
        });

        if (showFirstTime) {
            this.menu.showMenu();
        }
    }

    renderFilters(state) {
        this.filters.setState((filtersState) => ({
            ...filtersState,
            ...state,
        }));
    }

    /** Renders date range filter */
    renderCategoryDialog(state, prevState) {
        if (state.categoryDialog === prevState?.categoryDialog) {
            return;
        }

        if (state.categoryDialog.show && !this.setCategoryDialog) {
            this.setCategoryDialog = SetCategoryDialog.create({
                onChange: (category) => this.onChangeCategorySelect(category),
                onSubmit: () => this.store.dispatch(setItemsCategory()),
                onCancel: () => this.store.dispatch(actions.closeCategoryDialog()),
            });
        }
        if (!this.setCategoryDialog) {
            return;
        }

        this.setCategoryDialog.setState((dialogState) => ({
            ...dialogState,
            categoryId: state.categoryDialog.categoryId,
            type: state.categoryDialog.type,
        }));
        this.setCategoryDialog.show(state.categoryDialog.show);
    }

    renderDetails(state, prevState) {
        if (state.detailsId === prevState?.detailsId) {
            return;
        }

        if (!state.detailsId) {
            this.itemInfo.close();
            return;
        }

        const id = parseInt(state.detailsId, 10);
        const item = (state.detailsItem?.id === id)
            ? state.detailsItem
            : state.items.find((transaction) => transaction.id === id);
        if (!item) {
            throw new Error('Transaction not found');
        }

        if (!this.transactionDetails) {
            this.transactionDetails = TransactionDetails.create({
                item,
                onClose: () => this.closeDetails(),
            });
            this.itemInfo.setContent(this.transactionDetails.elem);
        } else {
            this.transactionDetails.setItem(item);
        }

        this.itemInfo.open();
    }

    renderHistory(state, prevState) {
        if (
            state.filter === prevState?.filter
            && state.mode === prevState?.mode
            && state.detailsId === prevState?.detailsId
        ) {
            return;
        }

        const url = (state.detailsId)
            ? getApplicationURL(`transactions/${state.detailsId}`)
            : this.getFilterURL(state);

        const pageTitle = `${__('appName')} | ${__('transactions.listTitle')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    renderCounters(state, prevState) {
        if (
            state.items === prevState.items
            && state.listMode === prevState.listMode
            && state.pagination?.total === prevState.pagination?.total
        ) {
            return;
        }

        const itemsCount = state.pagination.total;
        const isSelectMode = (state.listMode === 'select');
        const selected = (isSelectMode) ? getSelectedItems(state.items) : [];

        this.itemsCounter.setContent(itemsCount.toString());
        this.selectedCounter.show(isSelectMode);
        this.selectedCounter.setContent(selected.length.toString());
    }

    renderModeSelector(state, prevState) {
        if (
            state.items === prevState?.items
            && state.mode === prevState?.mode
        ) {
            return;
        }

        this.modeSelector.setURL(this.getFilterURL(state));
        this.modeSelector.setSelection(state.mode);
        this.modeSelector.show(state.items.length > 0);
    }

    renderList(state, prevState) {
        if (
            state.items === prevState.items
            && state.mode === prevState.mode
            && state.listMode === prevState.listMode
            && state.groupByDate === prevState.groupByDate
            && state.pagination.page === prevState.pagination?.page
            && state.pagination.range === prevState.pagination?.range
            && state.pagination.pagesCount === prevState.pagination?.pagesCount
            && state.pagination.onPage === prevState.pagination?.onPage
            && state.loading === prevState.loading
            && state.isLoadingMore === prevState.isLoadingMore
            && state.renderTime === prevState.renderTime
        ) {
            return;
        }

        let listItems = null;
        if (state.groupByDate) {
            let prevDate = null;
            const groups = [];
            let group = null;

            state.items.forEach((item) => {
                const currentDate = cutDate(timeToDate(item.date));
                if (currentDate !== prevDate) {
                    group = {
                        id: currentDate,
                        date: currentDate,
                        items: [],
                    };
                    groups.push(group);
                    prevDate = currentDate;
                }

                if (currentDate === prevDate) {
                    group.items.push(item);
                }
            });

            listItems = groups;
        } else {
            listItems = state.items;
        }

        this.list.setState((listState) => ({
            ...listState,
            mode: state.mode,
            listMode: state.listMode,
            showControls: (state.listMode === 'list'),
            showDate: !state.groupByDate,
            items: listItems,
            renderTime: state.renderTime,
        }));
    }

    renderListFooter(state) {
        const loadingMore = state.loading && state.isLoadingMore;
        const range = state.pagination.range ?? 1;
        const pageNum = state.pagination.page + range - 1;
        const filterURL = this.getFilterURL(state, false);

        // Paginator
        this.paginator.show(state.items.length > 0);
        this.paginator.setState((paginatorState) => ({
            ...paginatorState,
            url: filterURL.toString(),
            pagesCount: state.pagination.pagesCount,
            pageNum,
        }));

        // 'Show more' button
        this.showMoreBtn.show(
            state.items.length > 0
            && pageNum < state.pagination.pagesCount
            && !loadingMore,
        );

        // Loading more spinner
        this.spinner.show(loadingMore);
    }

    renderExportDialog(state, prevState) {
        if (state.showExportDialog === prevState?.showExportDialog) {
            return;
        }

        if (!state.showExportDialog) {
            this.exportDialog?.hide();
            return;
        }

        if (!this.exportDialog) {
            this.exportDialog = ExportDialog.create({
                filter: state.exportFilter,
                onCancel: () => this.store.dispatch(actions.hideExportDialog()),
            });
        } else {
            this.exportDialog.setFilter(state.exportFilter);
        }

        this.exportDialog.show();
    }

    render(state, prevState = {}) {
        this.renderHistory(state, prevState);

        if (state.loading && !state.isLoadingMore) {
            this.loadingIndicator.show();
        }

        this.renderFilters(state, prevState);
        this.renderCounters(state, prevState);
        this.renderModeSelector(state, prevState);
        this.renderList(state, prevState);
        this.renderListFooter(state, prevState);
        this.renderContextMenu(state, prevState);
        this.renderMenu(state, prevState);
        this.renderDetails(state, prevState);
        this.renderCategoryDialog(state, prevState);
        this.renderDeleteConfirmDialog(state, prevState);
        this.renderExportDialog(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(TransactionListView);
