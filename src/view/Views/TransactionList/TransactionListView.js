import 'jezvejs/style';
import {
    ge,
    createElement,
    show,
    insertAfter,
    asArray,
    setEvents,
    debounce,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { IconButton } from 'jezvejs/IconButton';
import { Paginator } from 'jezvejs/Paginator';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { DateRangeInput } from '../../Components/DateRangeInput/DateRangeInput.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { API } from '../../js/api/index.js';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
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

/* Strings */
const STR_TITLE = 'Transactions';
const PAGE_TITLE = 'Jezve Money | Transactions';
const MSG_SET_POS_FAIL = 'Fail to change position of transaction.';
const TITLE_SINGLE_TRANS_DELETE = 'Delete transaction';
const TITLE_MULTI_TRANS_DELETE = 'Delete transactions';
const MSG_MULTI_TRANS_DELETE = 'Are you sure want to delete selected transactions?<br>Changes in the balance of affected accounts will be canceled.';
const MSG_SINGLE_TRANS_DELETE = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';
/* Mode selector items */
const TITLE_SHOW_MAIN = 'Show main';
const TITLE_SHOW_DETAILS = 'Show details';
/* Date range input */
const START_DATE_PLACEHOLDER = 'From';
const END_DATE_PLACEHOLDER = 'To';
/* 'Show more' button */
const TITLE_SHOW_MORE = 'Show more...';
/* Accounts and persons filter */
const ACCOUNTS_GROUP_TITLE = 'Accounts';
const PERSONS_GROUP_TITLE = 'Persons';
const HIDDEN_ACCOUNTS_GROUP_TITLE = 'Hidden accounts';
const HIDDEN_PERSONS_GROUP_TITLE = 'Hidden persons';

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
            renderTime: Date.now(),
        };

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);

        this.store = createStore(reducer, initialState);
        this.store.subscribe((state, prevState) => {
            if (state !== prevState) {
                this.render(state, prevState);
            }
        });
    }

    /**
     * View initialization
     */
    onStart() {
        const elemIds = [
            'heading',
            'createBtn',
            // Filters
            'filtersBtn',
            'filtersContainer',
            'applyFiltersBtn',
            'clearFiltersBtn',
            'typeMenu',
            'accountsFilter',
            'dateFrm',
            'searchFilter',
            // Counters
            'itemsCount',
            'selectedCounter',
            'selItemsCount',
        ];
        elemIds.forEach((id) => {
            this[id] = ge(id);
            if (!this[id]) {
                throw new Error('Failed to initialize view');
            }
        });

        this.heading = Heading.fromElement(this.heading, {
            title: STR_TITLE,
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
                placeholder: 'Type to filter',
                enableFilter: true,
                noResultsMessage: 'Nothing found',
                onitemselect: (obj) => this.onAccountChange(obj),
                onchange: (obj) => this.onAccountChange(obj),
                className: 'dd_fullwidth',
            });

            window.app.appendAccounts(this.accountDropDown, {
                visible: true,
                idPrefix: 'a',
                group: ACCOUNTS_GROUP_TITLE,
            });
            window.app.appendAccounts(this.accountDropDown, {
                visible: false,
                idPrefix: 'a',
                group: HIDDEN_ACCOUNTS_GROUP_TITLE,
            });
            window.app.appendPersons(this.accountDropDown, {
                visible: true,
                idPrefix: 'p',
                group: PERSONS_GROUP_TITLE,
            });
            window.app.appendPersons(this.accountDropDown, {
                visible: false,
                idPrefix: 'p',
                group: HIDDEN_PERSONS_GROUP_TITLE,
            });
        }

        // Date range filter
        this.dateRangeFilter = DateRangeInput.fromElement(this.dateFrm, {
            startPlaceholder: START_DATE_PLACEHOLDER,
            endPlaceholder: END_DATE_PLACEHOLDER,
            onChange: (data) => this.onChangeDateFilter(data),
        });

        // Search input
        this.searchInput = SearchInput.create({
            placeholder: 'Type to filter',
            onChange: debounce((val) => this.onSearchInputChange(val), SEARCH_DELAY),
        });
        this.searchFilter.append(this.searchInput.elem);

        // Loading indicator
        this.listContainer = document.querySelector('.list-container');
        this.loadingIndicator = LoadingIndicator.create();
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
                textContent: TITLE_SHOW_MORE,
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
            className: 'no-icon',
            title: 'Done',
            onClick: () => this.setListMode('list'),
        });
        insertAfter(this.listModeBtn.elem, this.createBtn);

        this.createMenu();
        insertAfter(this.menu.elem, this.listModeBtn.elem);

        this.createContextMenu();

        this.render(this.store.getState());
    }

    createMenu() {
        this.menu = PopupMenu.create({
            id: 'listMenu',
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: 'Select',
                onClick: () => this.setListMode('select'),
            }, {
                id: 'sortModeBtn',
                icon: 'sort',
                title: 'Sort',
                onClick: () => this.setListMode('sort'),
            }, {
                id: 'separator1',
                type: 'separator',
            }, {
                id: 'selectAllBtn',
                title: 'Select all',
                onClick: () => this.selectAll(),
            }, {
                id: 'deselectAllBtn',
                title: 'Clear selection',
                onClick: () => this.deselectAll(),
            }, {
                id: 'separator2',
                type: 'separator',
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: 'Delete',
                onClick: () => this.confirmDelete(),
            }],
        });
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            attached: true,
            items: [{
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: 'Edit',
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: 'Delete',
                onClick: () => this.confirmDelete(),
            }],
        });
    }

    /** Returns true if accounts or persons is available */
    isAvailable() {
        const { accounts, persons } = window.app.model;
        return (accounts.length > 0 || persons.length > 0);
    }

    showContextMenu(itemId) {
        this.store.dispatch(actions.showContextMenu(itemId));
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

        window.app.createMessage(MSG_SET_POS_FAIL, 'msg_error');
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
            title: (multi) ? TITLE_MULTI_TRANS_DELETE : TITLE_SINGLE_TRANS_DELETE,
            content: (multi) ? MSG_MULTI_TRANS_DELETE : MSG_SINGLE_TRANS_DELETE,
            onconfirm: () => this.deleteItems(),
        });
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
            if (e?.target?.closest('.checkbox')) {
                e.preventDefault();
            }

            this.toggleSelectItem(itemId);
        }
    }

    replaceHistory() {
        const url = this.getFilterURL(this.store.getState());
        window.history.replaceState({}, PAGE_TITLE, url);
    }

    async requestTransactions(options) {
        this.startLoading();

        try {
            const result = await API.transaction.list(options);

            this.store.dispatch(actions.listRequestLoaded(result.data));
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
        const totalSelCount = selectedItems.length;

        show(this.createBtn, isListMode);
        this.listModeBtn.show(!isListMode);

        this.menu.show(itemsCount > 0);

        const { items } = this.menu;
        items.selectModeBtn.show(isListMode && itemsCount > 0);
        items.sortModeBtn.show(isListMode && itemsCount > 1);

        show(items.separator1, isSelectMode);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount > 0);
        show(items.separator2, isSelectMode);

        items.deleteBtn.show(isSelectMode && totalSelCount > 0);
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

    render(state) {
        if (state.loading) {
            this.loadingIndicator.show();
        }

        const filterUrl = this.getFilterURL(state, false);

        this.typeMenu.setURL(filterUrl);
        this.typeMenu.setSelection(state.form.type);

        this.renderAccountsFilter(state);

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
            title: (isDetails) ? TITLE_SHOW_MAIN : TITLE_SHOW_DETAILS,
            url: filterUrl.toString(),
        }));

        this.renderContextMenu(state);
        this.renderMenu(state);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(TransactionListView);
