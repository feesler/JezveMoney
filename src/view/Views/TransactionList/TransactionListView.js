import 'jezvejs/style';
import {
    createElement,
    show,
    insertAfter,
    asArray,
    setEvents,
    debounce,
    isFunction,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { IconButton } from 'jezvejs/IconButton';
import { Paginator } from 'jezvejs/Paginator';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../js/utils.js';
import { CategorySelect } from '../../Components/CategorySelect/CategorySelect.js';
import { DateRangeInput } from '../../Components/DateRangeInput/DateRangeInput.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { API } from '../../js/api/index.js';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { Field } from '../../Components/Field/Field.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import { SearchInput } from '../../Components/SearchInput/SearchInput.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { FiltersContainer } from '../../Components/FiltersContainer/FiltersContainer.js';
import { createStore } from '../../js/store.js';
import { reducer, actions, isSameSelection } from './reducer.js';
import './style.scss';

const SEARCH_DELAY = 500;

/**
 * List of transactions view
 */
class TransactionListView extends View {
    constructor(...args) {
        super(...args);

        const initialState = {
            items: [...this.props.transArr],
            filter: { ...this.props.filter },
            form: { ...this.props.filter },
            pagination: { ...this.props.pagination },
            mode: this.props.mode,
            loading: false,
            listMode: 'list',
            contextItem: null,
            selDateRange: null,
            showCategoryDialog: false,
            categoryDialog: {
                categoryId: 0,
            },
            renderTime: Date.now(),
        };

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'heading',
            'createBtn',
            // Filters
            'filtersBtn',
            'filtersContainer',
            'applyFiltersBtn',
            'clearFiltersBtn',
            'typeMenu',
            'accountsFilter',
            'categoriesFilter',
            'dateFrm',
            'searchFilter',
            // Counters
            'itemsCount',
            'selectedCounter',
            'selItemsCount',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('TRANSACTIONS'),
        });

        // Filters
        this.filtersBtn = IconButton.fromElement(this.filtersBtn, {
            onClick: () => this.filters.toggle(),
        });
        this.filters = FiltersContainer.create({
            content: this.filtersContainer,
        });
        insertAfter(this.filters.elem, this.filtersBtn.elem);

        setEvents(this.applyFiltersBtn, { click: () => this.filters.close() });
        setEvents(this.clearFiltersBtn, { click: (e) => this.onClearAllFilters(e) });

        // Transaction type filter
        this.typeMenu = TransactionTypeMenu.fromElement(this.typeMenu, {
            multiple: true,
            allowActiveLink: true,
            itemParam: 'type',
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });

        // Accounts and persons filter
        if (!this.isAvailable()) {
            show(this.accountsFilter, false);
        } else {
            this.accountDropDown = DropDown.create({
                elem: 'acc_id',
                placeholder: __('TYPE_TO_FILTER'),
                enableFilter: true,
                noResultsMessage: 'Nothing found',
                onitemselect: (obj) => this.onAccountChange(obj),
                onchange: (obj) => this.onAccountChange(obj),
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
                onitemselect: (obj) => this.onCategoryChange(obj),
                onchange: (obj) => this.onCategoryChange(obj),
                className: 'dd_fullwidth',
            });
        }

        // Date range filter
        this.dateRangeFilter = DateRangeInput.fromElement(this.dateFrm, {
            startPlaceholder: __('DATE_RANGE_FROM'),
            endPlaceholder: __('DATE_RANGE_TO'),
            onChange: (data) => this.onChangeDateFilter(data),
        });

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
        this.modeSelector = IconButton.create({
            type: 'link',
            className: 'mode-selector',
            onClick: (e) => this.onToggleMode(e),
        });
        listHeader.append(this.modeSelector.elem);

        // Transactions list
        const listContainer = document.querySelector('.list-container');
        this.list = TransactionList.create({
            listMode: 'list',
            onItemClick: (id, e) => this.onItemClick(id, e),
            onSort: (id, pos) => this.sendChangePosRequest(id, pos),
        });
        listContainer.append(this.list.elem);

        const listFooter = document.querySelector('.list-footer');
        // 'Show more' button
        this.showMoreBtn = createElement('button', {
            props: {
                className: 'btn show-more-btn',
                type: 'button',
                textContent: __('SHOW_MORE'),
            },
            events: { click: (e) => this.showMore(e) },
        });
        listFooter.append(this.showMoreBtn);

        // Paginator
        this.paginator = Paginator.create({
            arrows: true,
            breakLimit: 3,
            onChange: (page) => this.onChangePage(page),
        });
        listFooter.append(this.paginator.elem);

        // 'Done' button
        this.listModeBtn = IconButton.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('DONE'),
            onClick: () => this.setListMode('list'),
        });
        insertAfter(this.listModeBtn.elem, this.createBtn);

        this.createMenu();
        insertAfter(this.menu.elem, this.listModeBtn.elem);

        this.createContextMenu();

        this.subscribeToStore(this.store);
    }

    createMenu() {
        this.menu = PopupMenu.create({
            id: 'listMenu',
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
                id: 'setCategoryBtn',
                title: __('SET_CATEGORY'),
                onClick: () => this.onMenuClick('setCategoryBtn'),
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('DELETE'),
                onClick: () => this.onMenuClick('deleteBtn'),
            }],
        });

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            sortModeBtn: () => this.setListMode('sort'),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            setCategoryBtn: () => this.showCategoryDialog(),
            deleteBtn: () => this.confirmDelete(),
        };
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            attached: true,
            items: [{
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

    createSetCategoryDialog() {
        if (this.setCategoryDialog) {
            return;
        }

        this.categorySelect = CategorySelect.create({
            className: 'dd_fullwidth',
            onchange: (category) => this.onChangeCategorySelect(category),
        });
        this.categoryField = Field.create({
            title: __('TR_CATEGORY'),
            content: this.categorySelect.elem,
            className: 'view-row',
        });

        this.setCategoryDialog = ConfirmDialog.create({
            id: 'selectCategoryDialog',
            title: __('TR_SET_CATEGORY'),
            content: this.categoryField.elem,
            className: 'category-dialog',
            destroyOnResult: false,
            onconfirm: () => this.setItemsCategory(),
            onreject: () => this.closeCategoryDialog(),
        });
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

    showContextMenu(itemId) {
        this.store.dispatch(actions.showContextMenu(itemId));
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
    startLoading() {
        this.store.dispatch(actions.startLoading());
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

        const selected = this.list.getSelectedItems();
        return selected.map((item) => item.id);
    }

    /**
     * Sent AJAX request to server to change position of transaction
     * @param {number} transactionId - identifier of transaction to change position
     * @param {number} newPos  - new position of transaction
     */
    async sendChangePosRequest(transactionId, newPos) {
        this.startLoading();

        try {
            await API.transaction.setPos(transactionId, newPos);
            this.list.setPosition(transactionId, newPos);
        } catch (e) {
            this.cancelPosChange(transactionId);
        }

        this.stopLoading();
        this.setRenderTime();
    }

    /**
     * Cancel local changes on transaction position update fail
     * @param {number} trans_id - identifier of transaction
     */
    cancelPosChange() {
        this.render(this.store.getState());

        window.app.createMessage(__('ERR_TR_SET_POS'), 'msg_error');
    }

    /** Returns URL for filter of specified state */
    getFilterURL(state, keepPage = true) {
        const { baseURL } = window.app;
        const { filter } = state;
        const res = new URL(`${baseURL}transactions/`);

        Object.keys(filter).forEach((prop) => {
            const value = filter[prop];
            if (Array.isArray(value)) {
                const arrProp = `${prop}[]`;
                value.forEach((item) => res.searchParams.append(arrProp, item));
            } else {
                res.searchParams.set(prop, value);
            }
        });

        if (keepPage) {
            res.searchParams.set('page', state.pagination.page);
        }

        if (state.mode === 'details') {
            res.searchParams.set('mode', 'details');
        }

        return res;
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
            await API.transaction.del({ id: ids });
            this.requestTransactions(state.form);
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
            this.setRenderTime();
        }
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
            onconfirm: () => this.deleteItems(),
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
            await API.transaction.setCategory({ id: ids, category_id: categoryId });
            this.requestTransactions(state.form);
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
            this.setRenderTime();
        }
    }

    onChangeCategorySelect(category) {
        this.store.dispatch(actions.changeCategorySelect(category.id));
    }

    /** Date range filter change handler */
    onChangeDateFilter(data) {
        this.store.dispatch(actions.changeDateFilter(data));
        const state = this.store.getState();
        this.requestTransactions(state.form);
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
        this.replaceHistory();
        this.setRenderTime();
    }

    onItemClick(itemId, e) {
        const state = this.store.getState();
        if (state.listMode === 'list') {
            const menuBtn = e?.target?.closest('.popup-menu-btn');
            if (menuBtn) {
                this.showContextMenu(itemId);
            }
        } else if (state.listMode === 'select') {
            if (e?.target?.closest('.checkbox') && e.pointerType !== '') {
                e.preventDefault();
            }

            this.toggleSelectItem(itemId);
        }
    }

    replaceHistory() {
        const url = this.getFilterURL(this.store.getState());
        const pageTitle = `${__('APP_NAME')} ${__('TRANSACTIONS')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    async requestTransactions(options) {
        this.startLoading();

        const { keepState = false, ...request } = options;

        try {
            const result = await API.transaction.list(request);
            const payload = {
                ...result.data,
                keepState,
            };

            this.store.dispatch(actions.listRequestLoaded(payload));
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.store.dispatch(actions.listRequestError());
        }

        this.replaceHistory();
        this.stopLoading();
        this.setRenderTime();
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list') {
            this.contextMenu.detach();
            return;
        }
        const itemId = state.contextItem;
        if (!itemId) {
            this.contextMenu.detach();
            return;
        }
        const listItem = this.list.getListItemById(itemId);
        const menuContainer = listItem?.elem?.querySelector('.popup-menu');
        if (!menuContainer) {
            this.contextMenu.detach();
            return;
        }

        const { baseURL } = window.app;
        const { items } = this.contextMenu;
        items.ctxUpdateBtn.setURL(`${baseURL}transactions/update/${itemId}`);

        this.contextMenu.attachAndShow(menuContainer);
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
        const isListMode = state.listMode === 'list';
        const isSelectMode = (state.listMode === 'select');
        const selectedItems = this.list.getSelectedItems();
        const selCount = selectedItems.length;

        show(this.createBtn, isListMode);
        this.listModeBtn.show(!isListMode);

        this.menu.show(itemsCount > 0);

        const { items } = this.menu;
        items.selectModeBtn.show(isListMode && itemsCount > 0);
        items.sortModeBtn.show(isListMode && itemsCount > 1);

        show(items.separator1, isSelectMode);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && selCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && selCount > 0);
        show(items.separator2, isSelectMode);

        items.setCategoryBtn.show(isSelectMode && selCount > 0);
        items.deleteBtn.show(isSelectMode && selCount > 0);
    }

    /** Render accounts and persons selection */
    renderAccountsFilter(state) {
        if (!this.isAvailable()) {
            return;
        }

        const selectedItems = this.accountDropDown.getSelectedItems();
        const selectedIds = [];
        const idsToSelect = [
            ...asArray(state.form.acc_id).map((id) => `a${id}`),
            ...asArray(state.form.person_id).map((id) => `p${id}`),
        ];
        selectedItems.forEach(({ id }) => {
            selectedIds.push(id);
            if (!idsToSelect.includes(id)) {
                this.accountDropDown.deselectItem(id);
            }
        });
        idsToSelect.forEach((id) => {
            if (!selectedIds.includes(id)) {
                this.accountDropDown.selectItem(id.toString());
            }
        });
    }

    /** Render categories selection */
    renderCategoriesFilter(state) {
        if (!this.isAvailable()) {
            return;
        }

        const selectedItems = this.categoriesDropDown.getSelectedItems();
        const selectedIds = [];
        const idsToSelect = asArray(state.form.category_id);
        selectedItems.forEach(({ id }) => {
            selectedIds.push(id);
            if (!idsToSelect.includes(id)) {
                this.categoriesDropDown.deselectItem(id);
            }
        });
        idsToSelect.forEach((id) => {
            if (!selectedIds.includes(id)) {
                this.categoriesDropDown.selectItem(id.toString());
            }
        });
    }

    renderCategoryDialog(state, prevState) {
        if (state.showCategoryDialog === prevState?.showCategoryDialog) {
            return;
        }

        if (state.showCategoryDialog) {
            this.createSetCategoryDialog();
        }
        this.setCategoryDialog?.show(state.showCategoryDialog);
        this.categorySelect?.selectItem(state.categoryDialog.categoryId);
    }

    render(state, prevState = {}) {
        if (state.loading) {
            this.loadingIndicator.show();
        }

        const filterUrl = this.getFilterURL(state, false);

        this.typeMenu.setURL(filterUrl);
        this.typeMenu.setSelection(state.form.type);

        this.renderAccountsFilter(state);
        this.renderCategoriesFilter(state);

        // Render date
        const dateFilter = {
            stdate: (state.filter.stdate ?? null),
            enddate: (state.filter.enddate ?? null),
        };
        this.dateRangeFilter.setData(dateFilter);

        // Search form
        this.searchInput.value = state.form.search ?? '';

        // Render list
        this.list.setState((listState) => ({
            ...listState,
            mode: state.mode,
            listMode: state.listMode,
            showControls: (state.listMode === 'list'),
            items: state.items,
            renderTime: state.renderTime,
        }));

        // Counters
        const isSelectMode = (state.listMode === 'select');
        const selected = (isSelectMode) ? this.list.getSelectedItems() : [];
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
                url: filterUrl,
                pagesCount: state.pagination.pagesCount,
                pageNum,
            }));
        }

        show(
            this.showMoreBtn,
            state.items.length > 0
            && pageNum < state.pagination.pagesCount,
        );

        const isDetails = (state.mode === 'details');
        filterUrl.searchParams.set('mode', (isDetails) ? 'classic' : 'details');
        filterUrl.searchParams.set('page', state.pagination.page);
        this.modeSelector.show(state.items.length > 0);
        this.modeSelector.setState((modeSelectorState) => ({
            ...modeSelectorState,
            icon: (isDetails) ? 'mode-list' : 'mode-details',
            title: (isDetails) ? __('TR_LIST_SHOW_MAIN') : __('TR_LIST_SHOW_DETAILS'),
            url: filterUrl.toString(),
        }));

        this.renderContextMenu(state);
        this.renderMenu(state);

        this.renderCategoryDialog(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(TransactionListView);
