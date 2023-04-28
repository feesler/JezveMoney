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
import { PopupMenu } from 'jezvejs/PopupMenu';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { Spinner } from 'jezvejs/Spinner';
import { createStore } from 'jezvejs/Store';
import {
    __,
    cutDate,
    getHalfYearRange,
    getMonthRange,
    getWeekRange,
    timeToDate,
} from '../../js/utils.js';
import { CategorySelect } from '../../Components/CategorySelect/CategorySelect.js';
import { DateRangeSelector } from '../../Components/DateRangeSelector/DateRangeSelector.js';
import { DateRangeInput } from '../../Components/DateRangeInput/DateRangeInput.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { API } from '../../js/api/index.js';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import { SearchInput } from '../../Components/SearchInput/SearchInput.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { FiltersContainer } from '../../Components/FiltersContainer/FiltersContainer.js';
import { TransactionDetails } from './components/TransactionDetails/TransactionDetails.js';
import { TransactionListGroup } from '../../Components/TransactionListGroup/TransactionListGroup.js';
import { TransactionListItem } from '../../Components/TransactionListItem/TransactionListItem.js';
import { SetCategoryDialog } from '../../Components/SetCategoryDialog/SetCategoryDialog.js';
import {
    reducer,
    actions,
    isSameSelection,
    getSelectedItems,
} from './reducer.js';
import './TransactionListView.scss';

/* CSS classes */
const FILTER_HEADER_CLASS = 'filter-item__title';

const SEARCH_DELAY = 500;

/**
 * List of transactions view
 */
class TransactionListView extends View {
    constructor(...args) {
        super(...args);

        const initialState = {
            ...this.props,
            form: { ...this.props.filter },
            loading: false,
            isLoadingMore: false,
            listMode: 'list',
            groupByDate: this.getGroupByDate() === 1,
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

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);
        window.app.initCategoriesModel();

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
            title: __('TRANSACTIONS'),
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
            url: `${window.app.baseURL}transactions/create/`,
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
                placeholder: __('TYPE_TO_FILTER'),
                enableFilter: true,
                noResultsMessage: __('NOT_FOUND'),
                onItemSelect: (obj) => this.onAccountChange(obj),
                onChange: (obj) => this.onAccountChange(obj),
                className: 'dd_fullwidth',
            });

            window.app.appendAccounts(this.accountDropDown, {
                visible: true,
                idPrefix: 'a',
                group: __('ACCOUNTS'),
            });
            window.app.appendAccounts(this.accountDropDown, {
                visible: false,
                idPrefix: 'a',
                group: __('ACCOUNTS_HIDDEN'),
            });
            window.app.appendPersons(this.accountDropDown, {
                visible: true,
                idPrefix: 'p',
                group: __('PERSONS'),
            });
            window.app.appendPersons(this.accountDropDown, {
                visible: false,
                idPrefix: 'p',
                group: __('PERSONS_HIDDEN'),
            });
        }

        // Categories filter
        if (!this.isAvailable()) {
            show(this.categoriesFilter, false);
        } else {
            this.categoriesDropDown = CategorySelect.create({
                elem: 'category_id',
                placeholder: __('TYPE_TO_FILTER'),
                enableFilter: true,
                noResultsMessage: __('NOT_FOUND'),
                onItemSelect: (obj) => this.onCategoryChange(obj),
                onChange: (obj) => this.onCategoryChange(obj),
                className: 'dd_fullwidth',
            });
        }

        // Date range filter
        this.dateRangeFilterTitle = createElement('span', {
            props: { textContent: __('FILTER_DATE_RANGE') },
        });

        this.weekRangeBtn = DateRangeSelector.create({
            rangeType: 'week',
            title: __('DATE_RANGE_FOR_WEEK'),
            onClick: (e) => this.showWeekRange(e),
        });

        this.monthRangeBtn = DateRangeSelector.create({
            rangeType: 'month',
            title: __('DATE_RANGE_FOR_MONTH'),
            onClick: (e) => this.showMonthRange(e),
        });

        this.halfYearRangeBtn = DateRangeSelector.create({
            rangeType: 'halfyear',
            title: __('DATE_RANGE_FOR_HALF_YEAR'),
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
            startPlaceholder: __('DATE_RANGE_FROM'),
            endPlaceholder: __('DATE_RANGE_TO'),
            onChange: (data) => this.changeDateFilter(data),
        });
        this.dateFilter.append(this.dateRangeHeader, this.dateRangeFilter.elem);

        // Search input
        this.searchInput = SearchInput.create({
            placeholder: __('TYPE_TO_FILTER'),
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
        this.modeSelector = Button.create({
            type: 'link',
            className: 'mode-selector',
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
            title: __('SHOW_MORE'),
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
            title: __('DONE'),
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

    createMenu() {
        if (this.menu) {
            return;
        }

        this.menu = PopupMenu.create({
            id: 'listMenu',
            attachTo: this.menuButton.elem,
            onClose: () => this.hideMenu(),
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: __('SELECT'),
                onClick: () => this.onMenuClick('selectModeBtn'),
            }, {
                id: 'sortModeBtn',
                icon: 'sort',
                title: __('SORT'),
                onClick: () => this.onMenuClick('sortModeBtn'),
            }, {
                id: 'separator1',
                type: 'separator',
            }, {
                id: 'selectAllBtn',
                title: __('SELECT_ALL'),
                onClick: () => this.onMenuClick('selectAllBtn'),
            }, {
                id: 'deselectAllBtn',
                title: __('DESELECT_ALL'),
                onClick: () => this.onMenuClick('deselectAllBtn'),
            }, {
                id: 'separator2',
                type: 'separator',
            }, {
                id: 'exportBtn',
                type: 'link',
                icon: 'export',
                title: __('TR_EXPORT_CSV'),
                onClick: () => this.onMenuClick('exportBtn'),
            }, {
                id: 'setCategoryBtn',
                title: __('SET_CATEGORY'),
                onClick: () => this.onMenuClick('setCategoryBtn'),
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('DELETE'),
                onClick: () => this.onMenuClick('deleteBtn'),
            }, {
                id: 'separator3',
                type: 'separator',
            }, {
                id: 'groupByDateBtn',
                title: __('TR_LIST_GROUP_BY_DATE'),
                onClick: () => this.onMenuClick('groupByDateBtn'),
            }],
        });

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            sortModeBtn: () => this.setListMode('sort'),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            setCategoryBtn: () => this.showCategoryDialog(),
            deleteBtn: () => this.confirmDelete(),
            groupByDateBtn: () => this.toggleGroupByDate(),
        };
    }

    createContextMenu() {
        if (this.contextMenu) {
            return;
        }

        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            fixed: false,
            onItemClick: () => this.hideContextMenu(),
            onClose: () => this.hideContextMenu(),
            items: [{
                id: 'ctxDetailsBtn',
                type: 'link',
                title: __('OPEN_ITEM'),
                onClick: (e) => this.showDetails(e),
            }, {
                type: 'placeholder',
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('UPDATE'),
            }, {
                id: 'ctxSetCategoryBtn',
                title: __('SET_CATEGORY'),
                onClick: () => this.showCategoryDialog(),
            }, {
                type: 'separator',
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('DELETE'),
                onClick: () => this.confirmDelete(),
            }],
        });
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
        if (!isFunction(menuAction)) {
            return;
        }

        menuAction();
    }

    /** Returns true if accounts or persons is available */
    isAvailable() {
        const { accounts, persons } = window.app.model;
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

        window.app.createErrorNotification(__('ERR_TRANS_CHANGE_POS'));
    }

    getBaseFilterURL(path, filter) {
        const res = new URL(`${window.app.baseURL}${path}`);

        Object.keys(filter).forEach((prop) => {
            const value = filter[prop];
            if (Array.isArray(value)) {
                const arrProp = `${prop}[]`;
                value.forEach((item) => res.searchParams.append(arrProp, item));
            } else {
                res.searchParams.set(prop, value);
            }
        });

        return res;
    }

    /** Returns URL for filter of specified state */
    getFilterURL(state, keepPage = true) {
        const res = this.getBaseFilterURL('transactions/', state.filter);

        if (keepPage) {
            res.searchParams.set('page', state.pagination.page);
        }

        if (state.mode === 'details') {
            res.searchParams.set('mode', 'details');
        }

        return res;
    }

    /** Returns URL to export transaction */
    getExportURL(state) {
        return this.getBaseFilterURL('transactions/export/', state.filter);
    }

    /**
     * Clear all filters
     * @param {Event} e - click event object
     */
    onClearAllFilters(e) {
        e.preventDefault();

        this.store.dispatch(actions.clearAllFilters());
        const state = this.store.getState();
        this.requestTransactions(state.form);
    }

    /**
     * Transaction type menu change event handler
     */
    onChangeTypeFilter(selected) {
        this.store.dispatch(actions.changeTypeFilter(selected));
        const state = this.store.getState();
        this.requestTransactions(state.form);
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

        let state = this.store.getState();
        const filterAccounts = asArray(state.form.acc_id);
        const filterPersons = asArray(state.form.person_id);
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

        state = this.store.getState();
        this.requestTransactions(state.form);
    }

    /**
     * Categories filter change event handler
     * @param {object} obj - selection object
     */
    onCategoryChange(selected) {
        let state = this.store.getState();
        const categoryIds = asArray(selected).map(({ id }) => parseInt(id, 10));
        const filterCategories = asArray(state.form.category_id);
        if (isSameSelection(categoryIds, filterCategories)) {
            return;
        }

        this.store.dispatch(actions.changeCategoriesFilter(categoryIds));

        state = this.store.getState();
        this.requestTransactions(state.form);
    }

    /** Search field input event handler */
    onSearchInputChange(value) {
        this.store.dispatch(actions.changeSearchQuery(value));
        const state = this.store.getState();
        this.requestTransactions(state.form);
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
            window.app.createErrorNotification(e.message);
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
            title: (multi) ? __('TR_DELETE_MULTIPLE') : __('TR_DELETE'),
            content: (multi) ? __('MSG_TRANS_DELETE_MULTIPLE') : __('MSG_TRANS_DELETE'),
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
            window.app.createErrorNotification(e.message);
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
        const stdate = filter.stdate ?? null;
        const enddate = filter.enddate ?? null;

        if (stdate === data.stdate && enddate === data.enddate) {
            return;
        }

        this.store.dispatch(actions.changeDateFilter(data));
        const state = this.store.getState();
        this.requestTransactions(state.form);
    }

    showWeekRange(e) {
        e.preventDefault();
        this.changeDateFilter(getWeekRange());
    }

    showMonthRange(e) {
        e.preventDefault();
        this.changeDateFilter(getMonthRange());
    }

    showHalfYearRange(e) {
        e.preventDefault();
        this.changeDateFilter(getHalfYearRange());
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
            ...state.form,
            range,
            page,
            keepState: true,
            isLoadingMore: true,
        });
    }

    onChangePage(page) {
        const state = this.store.getState();
        this.requestTransactions({
            ...state.form,
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
                window.app.createErrorNotification(e.message);
                this.store.dispatch(actions.listRequestError());
            }
        }

        if (!aborted) {
            this.stopLoading();
            this.setRenderTime();
            this.abortController = null;
        }
    }

    getGroupByDate() {
        return window.app.model.profile.settings.tr_group_by_date;
    }

    toggleGroupByDate() {
        const { settings } = window.app.model.profile;
        const groupByDate = (settings.tr_group_by_date === 0) ? 1 : 0;
        this.requestGroupByDate(groupByDate);
    }

    async requestGroupByDate(groupByDate) {
        const { settings } = window.app.model.profile;
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
            window.app.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setRenderTime();
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list' || !state.showContextMenu) {
            this.contextMenu?.detach();
            return;
        }
        const itemId = state.contextItem;
        if (!itemId) {
            this.contextMenu?.detach();
            return;
        }

        const selector = `.trans-item[data-id="${itemId}"] .menu-btn`;
        const menuButton = this.listContainer.querySelector(selector);
        if (!menuButton) {
            this.contextMenu?.detach();
            return;
        }

        if (!this.contextMenu) {
            this.createContextMenu();
        }

        const { baseURL } = window.app;
        const { items } = this.contextMenu;
        items.ctxDetailsBtn.setURL(`${baseURL}transactions/${itemId}`);
        items.ctxUpdateBtn.setURL(`${baseURL}transactions/update/${itemId}`);

        this.contextMenu.attachAndShow(menuButton);
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';
        const isSortMode = state.listMode === 'sort';
        const selectedItems = getSelectedItems(state.items);
        const selCount = selectedItems.length;
        const groupByDate = this.getGroupByDate() === 1;

        this.createBtn.show(isListMode);
        this.listModeBtn.show(!isListMode);

        this.menuButton.show(itemsCount > 0 && !isSortMode);

        if (!state.showMenu) {
            this.menu?.hideMenu();
            return;
        }

        const showFirstTime = !this.menu;
        this.createMenu();

        const { items } = this.menu;
        items.selectModeBtn.show(isListMode && itemsCount > 0);
        items.sortModeBtn.show(isListMode && itemsCount > 1);

        show(items.separator1, isSelectMode);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && selCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && selCount > 0);
        show(items.separator2, isSelectMode);

        items.exportBtn.show(itemsCount > 0);
        if (itemsCount > 0) {
            const exportURL = this.getExportURL(state);
            items.exportBtn.setURL(exportURL.toString());
        }

        items.setCategoryBtn.show(isSelectMode && selCount > 0);
        items.deleteBtn.show(isSelectMode && selCount > 0);

        show(items.separator3, isListMode);
        items.groupByDateBtn.setIcon((groupByDate) ? 'check' : null);
        items.groupByDateBtn.show(isListMode);

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
            ...asArray(state.form.acc_id).map((id) => `a${id}`),
            ...asArray(state.form.person_id).map((id) => `p${id}`),
        ];

        this.accountDropDown.setSelection(idsToSelect);
    }

    /** Render categories selection */
    renderCategoriesFilter(state) {
        if (!this.isAvailable()) {
            return;
        }

        this.categoriesDropDown.setSelection(state.form.category_id);
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

        const { baseURL } = window.app;
        const url = (state.detailsId)
            ? new URL(`${baseURL}transactions/${state.detailsId}`)
            : this.getFilterURL(state);

        const pageTitle = `${__('APP_NAME')} | ${__('TRANSACTIONS')}`;
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
        const dateFilter = {
            stdate: (state.form.stdate ?? null),
            enddate: (state.form.enddate ?? null),
        };
        this.dateRangeFilter.setData(dateFilter);

        const dateFilterURL = this.getFilterURL(state, false);
        const weekRange = getWeekRange();
        dateFilterURL.searchParams.set('stdate', weekRange.stdate);
        dateFilterURL.searchParams.set('enddate', weekRange.enddate);
        this.weekRangeBtn.setURL(dateFilterURL.toString());

        const monthRange = getMonthRange();
        dateFilterURL.searchParams.set('stdate', monthRange.stdate);
        this.monthRangeBtn.setURL(dateFilterURL.toString());

        const halfYearRange = getHalfYearRange();
        dateFilterURL.searchParams.set('stdate', halfYearRange.stdate);
        this.halfYearRangeBtn.setURL(dateFilterURL.toString());

        // Search form
        this.searchInput.value = state.form.search ?? '';

        // Render list
        const groupByDate = this.getGroupByDate() === 1;
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
            icon: (isDetails) ? 'mode-list' : 'mode-details',
            title: (isDetails) ? __('TR_LIST_SHOW_MAIN') : __('TR_LIST_SHOW_DETAILS'),
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

window.app = new Application(window.appProps);
window.app.createView(TransactionListView);
