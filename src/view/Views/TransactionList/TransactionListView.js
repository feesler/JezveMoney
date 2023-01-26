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
import { Offcanvas } from 'jezvejs/Offcanvas';
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
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import { SearchInput } from '../../Components/SearchInput/SearchInput.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { FiltersContainer } from '../../Components/FiltersContainer/FiltersContainer.js';
import { TransactionDetails } from '../../Components/TransactionDetails/TransactionDetails.js';
import { SetCategoryDialog } from '../../Components/SetCategoryDialog/SetCategoryDialog.js';
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
            ...this.props,
            form: { ...this.props.filter },
            loading: false,
            listMode: 'list',
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

        // Transaction details
        this.itemInfo = Offcanvas.create({
            placement: 'right',
            className: 'transaction-details',
            onClosed: () => this.closeDetails(),
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
     */
    cancelPosChange() {
        this.render(this.store.getState());

        window.app.createMessage(__('ERR_TRANS_CHANGE_POS'), 'msg_error');
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

    async requestTransactions(options) {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        const { signal } = this.abortController;
        let aborted = false;
        const { keepState = false, ...request } = options;

        this.startLoading();

        try {
            const result = await API.transaction.list(request, { signal });
            const payload = {
                ...result.data,
                keepState,
            };

            this.store.dispatch(actions.listRequestLoaded(payload));
        } catch (e) {
            aborted = e.name === 'AbortError';
            if (!aborted) {
                window.app.createMessage(e.message, 'msg_error');
                this.store.dispatch(actions.listRequestError());
            }
        }

        if (!aborted) {
            this.stopLoading();
            this.setRenderTime();
            this.abortController = null;
        }
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
        items.ctxDetailsBtn.setURL(`${baseURL}transactions/${itemId}`);
        items.ctxUpdateBtn.setURL(`${baseURL}transactions/update/${itemId}`);

        this.contextMenu.attachAndShow(menuContainer);
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';
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

        if (state.loading) {
            this.loadingIndicator.show();
        }

        const filterURL = this.getFilterURL(state, false);

        this.typeMenu.setURL(filterURL);
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
                url: filterURL.toString(),
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
