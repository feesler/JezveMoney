import 'jezvejs/style';
import {
    show,
    insertAfter,
    asArray,
    setEvents,
    debounce,
    isFunction,
    createElement,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { DropDown } from 'jezvejs/DropDown';
import { MenuButton } from 'jezvejs/MenuButton';
import { Paginator } from 'jezvejs/Paginator';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { Spinner } from 'jezvejs/Spinner';
import { createStore } from 'jezvejs/Store';

import {
    __,
    cutDate,
    dateStringToTime,
    formatDateRange,
    getApplicationURL,
    getHalfYearRange,
    getMonthRange,
    getSelectedItems,
    getWeekRange,
    timeToDate,
} from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { API } from '../../API/index.js';
import { AppView } from '../../Components/AppView/AppView.js';

import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';

import { CategorySelect } from '../../Components/Inputs/CategorySelect/CategorySelect.js';
import { DateRangeSelector } from '../../Components/Inputs/Date/DateRangeSelector/DateRangeSelector.js';
import { DateRangeInput } from '../../Components/Inputs/Date/DateRangeInput/DateRangeInput.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { TransactionTypeMenu } from '../../Components/Fields/TransactionTypeMenu/TransactionTypeMenu.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import { SearchInput } from '../../Components/Inputs/SearchInput/SearchInput.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { FiltersContainer } from '../../Components/FiltersContainer/FiltersContainer.js';
import { TransactionDetails } from './components/TransactionDetails/TransactionDetails.js';
import { TransactionListGroup } from '../../Components/TransactionListGroup/TransactionListGroup.js';
import { TransactionListItem } from '../../Components/TransactionListItem/TransactionListItem.js';
import { SetCategoryDialog } from '../../Components/SetCategoryDialog/SetCategoryDialog.js';
import { ToggleDetailsButton } from '../../Components/ToggleDetailsButton/ToggleDetailsButton.js';
import { TransactionListContextMenu } from '../../Components/TransactionListContextMenu/TransactionListContextMenu.js';
import { TransactionListMainMenu } from './components/MainMenu/TransactionListMainMenu.js';

import { reducer, actions } from './reducer.js';
import {
    getTransactionsGroupByDate,
    isSameSelection,
} from './helpers.js';
import './TransactionListView.scss';

/* CSS classes */
const FILTER_HEADER_CLASS = 'filter-item__title';

const SEARCH_DELAY = 500;

/**
 * List of transactions view
 */
class TransactionListView extends AppView {
    constructor(...args) {
        super(...args);

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            sortModeBtn: () => this.setListMode('sort'),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            setCategoryBtn: () => this.showCategoryDialog(),
            deleteBtn: () => this.confirmDelete(),
            groupByDateBtn: () => this.toggleGroupByDate(),
        };

        this.contextMenuActions = {
            ctxDetailsBtn: () => this.showDetails(),
            ctxSetCategoryBtn: () => this.showCategoryDialog(),
            ctxDeleteBtn: () => this.confirmDelete(),
        };

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
            // Filters
            'filtersContainer',
            'applyFiltersBtn',
            'clearFiltersBtn',
            'typeFilter',
            'accountsFilter',
            'categoriesFilter',
            'dateFilter',
            'searchFilter',
            // Counters
            'itemsCount',
            'selectedCounter',
            'selItemsCount',
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
            onClick: () => this.filters.toggle(),
        });
        this.createBtn = Button.create({
            id: 'createBtn',
            type: 'link',
            className: 'circle-btn',
            icon: 'plus',
            url: `${App.baseURL}transactions/create/`,
        });
        this.heading.actionsContainer.append(this.filtersBtn.elem, this.createBtn.elem);

        this.filters = FiltersContainer.create({
            content: this.filtersContainer,
        });
        this.contentHeader.prepend(this.filters.elem);

        setEvents(this.applyFiltersBtn, { click: () => this.filters.close() });
        setEvents(this.clearFiltersBtn, { click: (e) => this.onClearAllFilters(e) });

        // Transaction type filter
        this.typeMenu = TransactionTypeMenu.create({
            id: 'typeMenu',
            multiple: true,
            allowActiveLink: true,
            showChangeLimit: true,
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });
        this.typeFilter.append(this.typeMenu.elem);

        // Accounts and persons filter
        if (!this.isAvailable()) {
            show(this.accountsFilter, false);
        } else {
            this.accountDropDown = DropDown.create({
                elem: 'acc_id',
                placeholder: __('typeToFilter'),
                enableFilter: true,
                noResultsMessage: __('notFound'),
                onItemSelect: (obj) => this.onAccountChange(obj),
                onChange: (obj) => this.onAccountChange(obj),
                className: 'dd_fullwidth',
            });

            App.appendAccounts(this.accountDropDown, {
                visible: true,
                idPrefix: 'a',
                group: __('accounts.listTitle'),
            });
            App.appendAccounts(this.accountDropDown, {
                visible: false,
                idPrefix: 'a',
                group: __('accounts.hiddenListTitle'),
            });
            App.appendPersons(this.accountDropDown, {
                visible: true,
                idPrefix: 'p',
                group: __('persons.listTitle'),
            });
            App.appendPersons(this.accountDropDown, {
                visible: false,
                idPrefix: 'p',
                group: __('persons.hiddenListTitle'),
            });
        }

        // Categories filter
        if (!this.isAvailable()) {
            show(this.categoriesFilter, false);
        } else {
            this.categoriesDropDown = CategorySelect.create({
                elem: 'category_id',
                placeholder: __('typeToFilter'),
                enableFilter: true,
                noResultsMessage: __('notFound'),
                onItemSelect: (obj) => this.onCategoryChange(obj),
                onChange: (obj) => this.onCategoryChange(obj),
                className: 'dd_fullwidth',
            });
        }

        // Date range filter
        this.dateRangeFilterTitle = createElement('span', {
            props: { textContent: __('filters.dateRange') },
        });

        this.weekRangeBtn = DateRangeSelector.create({
            rangeType: 'week',
            title: __('dateRange.forWeek'),
            onClick: (e) => this.showWeekRange(e),
        });

        this.monthRangeBtn = DateRangeSelector.create({
            rangeType: 'month',
            title: __('dateRange.forMonth'),
            onClick: (e) => this.showMonthRange(e),
        });

        this.halfYearRangeBtn = DateRangeSelector.create({
            rangeType: 'halfyear',
            title: __('dateRange.forHalfYear'),
            onClick: (e) => this.showHalfYearRange(e),
        });

        this.dateRangeHeader = createElement('header', {
            props: { className: FILTER_HEADER_CLASS },
            children: [
                this.dateRangeFilterTitle,
                this.weekRangeBtn.elem,
                this.monthRangeBtn.elem,
                this.halfYearRangeBtn.elem,
            ],
        });

        this.dateRangeFilter = DateRangeInput.create({
            id: 'dateFrm',
            startPlaceholder: __('dateRange.from'),
            endPlaceholder: __('dateRange.to'),
            onChange: (data) => this.changeDateFilter(data),
        });
        this.dateFilter.append(this.dateRangeHeader, this.dateRangeFilter.elem);

        // Search input
        this.searchInput = SearchInput.create({
            placeholder: __('typeToFilter'),
            onChange: debounce((val) => this.onSearchInputChange(val), SEARCH_DELAY),
        });
        this.searchFilter.append(this.searchInput.elem);

        // Loading indicator
        this.listContainer = document.querySelector('.list-container');
        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });
        this.listContainer.append(this.loadingIndicator.elem);

        // List mode selected
        const listHeader = document.querySelector('.list-header');
        this.modeSelector = ToggleDetailsButton.create({
            onClick: (e) => this.onToggleMode(e),
        });
        listHeader.append(this.modeSelector.elem);

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
            onClick: () => this.setListMode('list'),
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

    onMenuClick(item) {
        this.menu.hideMenu();

        const menuAction = this.menuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
    }

    onContextMenuClick(item) {
        this.hideContextMenu();

        const menuAction = this.contextMenuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
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

    showCategoryDialog() {
        const ids = this.getContextIds();
        if (ids.length === 0) {
            return;
        }

        this.store.dispatch(actions.showCategoryDialog(ids));
    }

    closeCategoryDialog() {
        this.store.dispatch(actions.closeCategoryDialog());
    }

    toggleSelectItem(itemId) {
        this.store.dispatch(actions.toggleSelectItem(itemId));
    }

    selectAll() {
        this.store.dispatch(actions.selectAllItems());
    }

    deselectAll() {
        this.store.dispatch(actions.deselectAllItems());
    }

    setListMode(listMode) {
        this.store.dispatch(actions.changeListMode(listMode));
        this.setRenderTime();
    }

    /** Set loading state and render view */
    startLoading(isLoadingMore = false) {
        this.store.dispatch(actions.startLoading(isLoadingMore));
    }

    /** Remove loading state and render view */
    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    /** Update render time */
    setRenderTime() {
        this.store.dispatch(actions.setRenderTime());
    }

    getContextIds() {
        const state = this.store.getState();
        if (state.listMode === 'list') {
            return asArray(state.contextItem);
        }

        const selected = getSelectedItems(state.items);
        return selected.map((item) => item.id);
    }

    getListRequest(state) {
        return {
            ...state.form,
            order: 'desc',
            page: state.pagination.page,
            range: state.pagination.range,
        };
    }

    prepareRequest(data, state) {
        return {
            ...data,
            returnState: {
                transactions: this.getListRequest(state),
            },
        };
    }

    getListDataFromResponse(response) {
        return response?.data?.state?.transactions;
    }

    setListData(data, keepState = false) {
        const payload = {
            ...data,
            keepState,
        };

        this.store.dispatch(actions.listRequestLoaded(payload));
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

        this.sendChangePosRequest(item.id, pos);
    }

    /**
     * Sent AJAX request to server to change position of transaction
     * @param {number} id - identifier of transaction to change position
     * @param {number} pos  - new position of transaction
     */
    async sendChangePosRequest(id, pos) {
        const state = this.store.getState();

        this.startLoading();

        try {
            const request = this.prepareRequest({ id, pos }, state);
            const response = await API.transaction.setPos(request);
            const data = this.getListDataFromResponse(response);
            this.setListData(data, true);
        } catch (e) {
            this.cancelPosChange();
        }

        this.stopLoading();
        this.setRenderTime();
    }

    /**
     * Cancel local changes on transaction position update fail
     */
    cancelPosChange() {
        this.render(this.store.getState());

        App.createErrorNotification(__('transactions.errors.changePos'));
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
        asArray(selected).forEach(({ id }) => {
            const arr = (id.startsWith('a')) ? accountIds : personIds;
            const itemId = parseInt(id.substring(1), 10);
            arr.push(itemId);
        });

        const state = this.store.getState();
        const filterAccounts = asArray(state.form.accounts);
        const filterPersons = asArray(state.form.persons);
        const accountsChanged = !isSameSelection(accountIds, filterAccounts);
        const personsChanged = !isSameSelection(personIds, filterPersons);
        if (!accountsChanged && !personsChanged) {
            return;
        }

        if (accountsChanged) {
            this.store.dispatch(actions.changeAccountsFilter(accountIds));
        }
        if (personsChanged) {
            this.store.dispatch(actions.changePersonsFilter(personIds));
        }

        this.requestTransactions(this.getRequestData());
    }

    /**
     * Categories filter change event handler
     * @param {object} obj - selection object
     */
    onCategoryChange(selected) {
        const state = this.store.getState();
        const categoryIds = asArray(selected).map(({ id }) => parseInt(id, 10));
        const filterCategories = asArray(state.form.categories);
        if (isSameSelection(categoryIds, filterCategories)) {
            return;
        }

        this.store.dispatch(actions.changeCategoriesFilter(categoryIds));

        this.requestTransactions(this.getRequestData());
    }

    /** Search field input event handler */
    onSearchInputChange(value) {
        this.store.dispatch(actions.changeSearchQuery(value));
        this.requestTransactions(this.getRequestData());
    }

    async deleteItems() {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const ids = this.getContextIds();
        if (ids.length === 0) {
            return;
        }

        this.startLoading();

        try {
            const request = this.prepareRequest({ id: ids }, state);
            const response = await API.transaction.del(request);
            const data = this.getListDataFromResponse(response);
            this.setListData(data);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setRenderTime();
    }

    /**
     * Create and show transaction delete warning popup
     */
    confirmDelete() {
        const ids = this.getContextIds();
        if (ids.length === 0) {
            return;
        }

        const multi = (ids.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multi) ? __('transactions.deleteMultiple') : __('transactions.delete'),
            content: (multi) ? __('transactions.deleteMultipleMessage') : __('transactions.deleteMessage'),
            onConfirm: () => this.deleteItems(),
        });
    }

    /** Send API request to change category of selected transactions */
    async setItemsCategory() {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const { ids, categoryId } = state.categoryDialog;
        if (ids.length === 0) {
            return;
        }

        this.closeCategoryDialog();
        this.startLoading();

        try {
            const request = this.prepareRequest({ id: ids, category_id: categoryId }, state);
            const response = await API.transaction.setCategory(request);
            const data = this.getListDataFromResponse(response);
            this.setListData(data);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setRenderTime();
    }

    onChangeCategorySelect(category) {
        this.store.dispatch(actions.changeCategorySelect(category.id));
    }

    /** Date range filter change handler */
    changeDateFilter(data) {
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

    showWeekRange(e) {
        e.preventDefault();

        const range = getWeekRange();
        this.changeDateFilter(formatDateRange(range));
    }

    showMonthRange(e) {
        e.preventDefault();

        const range = getMonthRange();
        this.changeDateFilter(formatDateRange(range));
    }

    showHalfYearRange(e) {
        e.preventDefault();

        const range = getHalfYearRange();
        this.changeDateFilter(formatDateRange(range));
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

    onToggleMode(e) {
        e.preventDefault();

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

        this.startLoading(isLoadingMore);

        try {
            const { data } = await API.transaction.list(request, { signal });
            this.setListData(data, keepState);
        } catch (e) {
            aborted = e.name === 'AbortError';
            if (!aborted) {
                App.createErrorNotification(e.message);
                this.store.dispatch(actions.listRequestError());
            }
        }

        if (!aborted) {
            this.stopLoading();
            this.setRenderTime();
            this.abortController = null;
        }
    }

    toggleGroupByDate() {
        const { settings } = App.model.profile;
        const groupByDate = (settings.tr_group_by_date === 0) ? 1 : 0;
        this.requestGroupByDate(groupByDate);
    }

    async requestGroupByDate(groupByDate) {
        const { settings } = App.model.profile;
        if (settings.tr_group_by_date === groupByDate) {
            return;
        }

        this.startLoading();

        try {
            await API.profile.updateSettings({
                tr_group_by_date: groupByDate,
            });
            settings.tr_group_by_date = groupByDate;

            this.store.dispatch(actions.toggleGroupByDate());
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setRenderTime();
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = TransactionListContextMenu.create({
                id: 'contextMenu',
                onItemClick: (item) => this.onContextMenuClick(item),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.contextMenu.setState({
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
                onItemClick: (item) => this.onMenuClick(item),
                onClose: () => this.hideMenu(),
            });
        }

        this.menu.setState({
            listMode: state.listMode,
            showMenu: state.showMenu,
            items: state.items,
            filter: state.filter,
        });

        if (showFirstTime) {
            this.menu.showMenu();
        }
    }

    /** Render accounts and persons selection */
    renderAccountsFilter(state) {
        if (!this.isAvailable()) {
            return;
        }

        const idsToSelect = [
            ...asArray(state.form.accounts).map((id) => `a${id}`),
            ...asArray(state.form.persons).map((id) => `p${id}`),
        ];

        this.accountDropDown.setSelection(idsToSelect);
    }

    /** Render categories selection */
    renderCategoriesFilter(state) {
        if (!this.isAvailable()) {
            return;
        }

        this.categoriesDropDown.setSelection(state.form.categories);
    }

    renderCategoryDialog(state, prevState) {
        if (state.categoryDialog === prevState?.categoryDialog) {
            return;
        }

        if (state.categoryDialog.show && !this.setCategoryDialog) {
            this.setCategoryDialog = SetCategoryDialog.create({
                onChange: (category) => this.onChangeCategorySelect(category),
                onSubmit: () => this.setItemsCategory(),
                onCancel: () => this.closeCategoryDialog(),
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

    render(state, prevState = {}) {
        this.renderHistory(state, prevState);

        const loadingMore = state.loading && state.isLoadingMore;
        if (state.loading && !state.isLoadingMore) {
            this.loadingIndicator.show();
        }

        const filterURL = this.getFilterURL(state, false);

        this.typeMenu.setURL(filterURL);
        this.typeMenu.setSelection(state.form.type);

        this.renderAccountsFilter(state);
        this.renderCategoriesFilter(state);

        // Date range filter
        this.dateRangeFilter.setState((rangeState) => ({
            ...rangeState,
            form: {
                ...rangeState.form,
                startDate: state.form.startDate,
                endDate: state.form.endDate,
            },
            filter: {
                ...rangeState.filter,
                startDate: dateStringToTime(state.form.startDate),
                endDate: dateStringToTime(state.form.endDate),
            },
        }));

        const dateFilterURL = this.getFilterURL(state, false);
        const weekRange = getWeekRange();
        dateFilterURL.searchParams.set('startDate', weekRange.startDate);
        dateFilterURL.searchParams.set('endDate', weekRange.endDate);
        this.weekRangeBtn.setURL(dateFilterURL.toString());

        const monthRange = getMonthRange();
        dateFilterURL.searchParams.set('startDate', monthRange.startDate);
        this.monthRangeBtn.setURL(dateFilterURL.toString());

        const halfYearRange = getHalfYearRange();
        dateFilterURL.searchParams.set('startDate', halfYearRange.startDate);
        this.halfYearRangeBtn.setURL(dateFilterURL.toString());

        // Search form
        this.searchInput.value = state.form.search ?? '';

        // Render list
        const groupByDate = getTransactionsGroupByDate() === 1;
        let listItems = null;
        if (groupByDate) {
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
            showDate: !groupByDate,
            items: listItems,
            renderTime: state.renderTime,
        }));

        // Counters
        const isSelectMode = (state.listMode === 'select');
        const selected = (isSelectMode) ? getSelectedItems(state.items) : [];
        this.itemsCount.textContent = state.pagination.total;
        show(this.selectedCounter, isSelectMode);
        this.selItemsCount.textContent = selected.length;

        // Paginator
        const range = state.pagination.range ?? 1;
        const pageNum = state.pagination.page + range - 1;
        if (this.paginator) {
            this.paginator.show(state.items.length > 0);
            this.paginator.setState((paginatorState) => ({
                ...paginatorState,
                url: filterURL.toString(),
                pagesCount: state.pagination.pagesCount,
                pageNum,
            }));
        }

        this.showMoreBtn.show(
            state.items.length > 0
            && pageNum < state.pagination.pagesCount
            && !loadingMore,
        );
        this.spinner.show(loadingMore);

        const isDetails = (state.mode === 'details');

        const modeURL = this.getFilterURL(state);
        modeURL.searchParams.set('mode', (isDetails) ? 'classic' : 'details');

        this.modeSelector.show(state.items.length > 0);
        this.modeSelector.setState((modeSelectorState) => ({
            ...modeSelectorState,
            details: isDetails,
            url: modeURL.toString(),
        }));

        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDetails(state, prevState);
        this.renderCategoryDialog(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(TransactionListView);
