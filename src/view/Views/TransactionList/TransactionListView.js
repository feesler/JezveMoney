import 'jezvejs/style';
import {
    ge,
    show,
    setEvents,
    insertAfter,
    throttle,
    asArray,
} from 'jezvejs';
import { Collapsible } from 'jezvejs/Collapsible';
import { DropDown } from 'jezvejs/DropDown';
import { Paginator } from 'jezvejs/Paginator';
import 'jezvejs/style/InputGroup';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { API } from '../../js/api/index.js';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { PopupMenu } from '../../Components/PopupMenu/PopupMenu.js';
import { LinkMenu } from '../../Components/LinkMenu/LinkMenu.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { DateRangeInput } from '../../Components/DateRangeInput/DateRangeInput.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import './style.scss';

const PAGE_TITLE = 'Jezve Money | Transactions';
const MSG_SET_POS_FAIL = 'Fail to change position of transaction.';
const TITLE_SINGLE_TRANS_DELETE = 'Delete transaction';
const TITLE_MULTI_TRANS_DELETE = 'Delete transactions';
const MSG_MULTI_TRANS_DELETE = 'Are you sure want to delete selected transactions?<br>Changes in the balance of affected accounts will be canceled.';
const MSG_SINGLE_TRANS_DELETE = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';
/* Mode selector items */
const TITLE_CLASSIC = 'Classic';
const TITLE_DETAILS = 'Details';
/* Date range input */
const START_DATE_PLACEHOLDER = 'From';
const END_DATE_PLACEHOLDER = 'To';

const SEARCH_THROTTLE = 300;

/**
 * List of transactions view
 */
class TransactionListView extends View {
    constructor(...args) {
        super(...args);

        this.state = {
            items: [...this.props.transArr],
            filter: { ...this.props.filter },
            form: { ...this.props.filter },
            pagination: { ...this.props.pagination },
            mode: this.props.mode,
            loading: false,
            listMode: 'list',
            contextItem: null,
            typingSearch: false,
            selDateRange: null,
        };

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
    }

    /**
     * View initialization
     */
    onStart() {
        const collapse = new Collapsible({
            header: [ge('filtershdr')],
            content: ge('filters'),
            className: 'filters-collapsible',
        });
        ge('filterscollapse').appendChild(collapse.elem);

        this.clearAllBtn = ge('clearall_btn');
        this.clearAllBtn.addEventListener('click', (e) => this.onClearAllFilters(e));

        this.typeMenu = TransactionTypeMenu.fromElement(ge('type_menu'), {
            multiple: true,
            allowActiveLink: true,
            itemParam: 'type',
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });

        const accountsFilter = ge('accountsFilter');
        if (window.app.model.accounts.length === 0) {
            show(accountsFilter, false);
        } else {
            this.accountDropDown = DropDown.create({
                elem: 'acc_id',
                placeholder: 'Select account',
                onitemselect: (obj) => this.onAccountChange(obj),
                onchange: (obj) => this.onAccountChange(obj),
                className: 'dd_fullwidth',
            });
            if (!this.accountDropDown) {
                throw new Error('Failed to initialize Transaction List view');
            }
            window.app.initAccountsList(this.accountDropDown);
        }

        const personsFilter = ge('personsFilter');
        if (window.app.model.persons.length === 0) {
            show(personsFilter, false);
        } else {
            this.personDropDown = DropDown.create({
                elem: 'person_id',
                placeholder: 'Select person',
                onitemselect: (obj) => this.onPersonChange(obj),
                onchange: (obj) => this.onPersonChange(obj),
                className: 'dd_fullwidth',
            });
            if (!this.personDropDown) {
                throw new Error('Failed to initialize Transaction List view');
            }
            window.app.initPersonsList(this.personDropDown);
        }

        this.searchFrm = ge('searchFrm');
        if (!this.searchFrm) {
            throw new Error('Failed to initialize Transaction List view');
        }
        this.searchFrm.addEventListener('submit', (e) => this.onSearchSubmit(e));

        this.searchInp = ge('search');
        if (!this.searchInp) {
            throw new Error('Failed to initialize Transaction List view');
        }
        this.searchInp.inputMode = 'search';
        this.searchHandler = throttle((e) => this.onSearchInput(e), SEARCH_THROTTLE);
        this.searchInp.addEventListener('input', this.searchHandler);

        this.noSearchBtn = ge('nosearchbtn');
        if (!this.noSearchBtn) {
            throw new Error('Failed to initialize Transaction List view');
        }
        setEvents(this.noSearchBtn, { click: () => this.onSearchClear() });

        // Date range filter
        this.dateRangeFilter = DateRangeInput.fromElement(ge('dateFrm'), {
            startPlaceholder: START_DATE_PLACEHOLDER,
            endPlaceholder: END_DATE_PLACEHOLDER,
            onChange: (data) => this.onChangeDateFilter(data),
        });

        this.listContainer = document.querySelector('.list-container');
        this.loadingIndicator = LoadingIndicator.create();
        this.listContainer.append(this.loadingIndicator.elem);

        const listHeader = document.querySelector('.list-header');
        this.modeSelector = LinkMenu.create({
            className: 'mode-selector',
            itemParam: 'mode',
            items: [
                { icon: 'mode-list', title: TITLE_CLASSIC, value: 'classic' },
                { icon: 'mode-details', title: TITLE_DETAILS, value: 'details' },
            ],
            onChange: (mode) => this.onModeChanged(mode),
        });

        const paginatorOptions = {
            onChange: (page) => this.onChangePage(page),
        };

        this.topPaginator = Paginator.create(paginatorOptions);
        listHeader.append(this.modeSelector.elem, this.topPaginator.elem);

        this.list = TransactionList.create({
            elem: document.querySelector('.trans-list'),
            selectable: true,
            sortable: true,
            listMode: 'list',
            onSelect: (id) => this.onItemSelect(id),
            onSort: (id, pos) => this.sendChangePosRequest(id, pos),
            onContextMenu: (id) => this.onContextMenu(id),
        });

        const listFooter = document.querySelector('.list-footer');
        this.bottomPaginator = Paginator.create(paginatorOptions);
        listFooter.append(this.bottomPaginator.elem);

        this.createBtn = ge('add_btn');
        this.createMenu();
        insertAfter(this.menu.elem, this.createBtn);

        this.createContextMenu();

        this.render(this.state);
    }

    createMenu() {
        this.menu = PopupMenu.create({ id: 'listMenu' });

        this.selectModeBtn = this.menu.addIconItem({
            id: 'selectModeBtn',
            icon: 'select',
            title: 'Select',
            onClick: () => this.toggleSelectMode(),
        });
        this.menu.addSeparator();
        this.separator1 = this.menu.addSeparator();

        this.selectAllBtn = this.menu.addIconItem({
            id: 'selectAllBtn',
            title: 'Select all',
            onClick: () => this.selectAll(),
        });
        this.deselectAllBtn = this.menu.addIconItem({
            id: 'deselectAllBtn',
            title: 'Clear selection',
            onClick: () => this.deselectAll(),
        });
        this.separator2 = this.menu.addSeparator();

        this.deleteBtn = this.menu.addIconItem({
            id: 'deleteBtn',
            icon: 'del',
            title: 'Delete',
            onClick: () => this.confirmDelete(),
        });
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            attachTo: this.list.elem,
        });

        this.ctxUpdateBtn = this.contextMenu.addIconItem({
            id: 'ctxUpdateBtn',
            type: 'link',
            icon: 'update',
            title: 'Edit',
        });
        this.ctxDeleteBtn = this.contextMenu.addIconItem({
            id: 'ctxDeleteBtn',
            icon: 'del',
            title: 'Delete',
            onClick: () => this.confirmDelete(),
        });
    }

    showContextMenu(itemId) {
        if (this.state.contextItem === itemId) {
            return;
        }

        this.setState({ ...this.state, contextItem: itemId });
    }

    toggleSelectItem(itemId) {
        this.list.toggleSelectItem(itemId);
        this.setState({
            ...this.state,
            items: this.list.getItems(),
        });
    }

    reduceSelectAll(state = this.state) {
        const selectItem = (item) => (
            (item.selected)
                ? item
                : { ...item, selected: true }
        );

        return {
            ...state,
            items: state.items.map(selectItem),
        };
    }

    reduceDeselectAll(state = this.state) {
        const deselectItem = (item) => (
            (item.selected)
                ? { ...item, selected: false }
                : item
        );

        return {
            ...state,
            items: state.items.map(deselectItem),
        };
    }

    selectAll() {
        this.setState(this.reduceSelectAll());
    }

    deselectAll() {
        this.setState(this.reduceDeselectAll());
    }

    toggleSelectMode() {
        let newState = {
            ...this.state,
            listMode: (this.state.listMode === 'list') ? 'select' : 'list',
            contextItem: null,
        };
        if (newState.listMode === 'list') {
            newState = this.reduceDeselectAll(newState);
        }

        this.setState(newState);
    }

    /** Set loading state and render view */
    startLoading() {
        if (this.state.loading) {
            return;
        }

        this.setState({ ...this.state, loading: true });
    }

    /** Remove loading state and render view */
    stopLoading() {
        if (!this.state.loading) {
            return;
        }

        this.setState({ ...this.state, loading: false });
    }

    getContextIds(state = this.state) {
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
    }

    /**
     * Cancel local changes on transaction position update fail
     * @param {number} trans_id - identifier of transaction
     */
    cancelPosChange() {
        this.render(this.state);

        window.app.createMessage(MSG_SET_POS_FAIL, 'msg_error');
    }

    /** Returns URL for filter of specified state */
    getFilterURL(state = this.state, keepPage = true) {
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
        e.stopPropagation();
        e.preventDefault();

        this.state.form = {};
        this.state.pagination.page = 1;

        this.requestTransactions(this.state.form);
    }

    /**
     * Transaction type menu change event handler
     */
    onChangeTypeFilter(selected) {
        this.state.form.type = selected;
        this.requestTransactions(this.state.form);
    }

    isSameSelection(a, b) {
        return a.length === b.length && a.every((id) => b.includes(id));
    }

    /**
     * Account change event handler
     * @param {object} obj - selection object
     */
    onAccountChange(obj) {
        const data = Array.isArray(obj) ? obj : [obj];
        const ids = data.map((item) => parseInt(item.id, 10));
        const filterIds = this.state.form.acc_id ?? [];

        if (this.isSameSelection(ids, filterIds)) {
            return;
        }

        // Prepare parameters
        this.state.form.acc_id = ids;
        this.requestTransactions(this.state.form);
    }

    /**
     * Persons filter change event handler
     * @param {object} obj - selection object
     */
    onPersonChange(obj) {
        const data = Array.isArray(obj) ? obj : [obj];
        const ids = data.map((item) => parseInt(item.id, 10));
        const filterIds = this.state.form.person_id ?? [];

        if (this.isSameSelection(ids, filterIds)) {
            return;
        }

        // Prepare parameters
        this.state.form.person_id = ids;
        this.requestTransactions(this.state.form);
    }

    /**
     * Transaction search form submit event handler
     * @param {Event} e - submit event
     */
    onSearchSubmit(e) {
        e.preventDefault();

        this.onSearchInput();
    }

    /** Search field input event handler */
    onSearchInput() {
        const searchQuery = this.searchInp.value;
        if (this.state.form.search === searchQuery) {
            return;
        }

        if (searchQuery.length > 0) {
            this.state.form.search = searchQuery;
        } else if ('search' in this.state.form) {
            delete this.state.form.search;
        }

        this.state.typingSearch = true;

        this.requestTransactions(this.state.form);
    }

    /**
     * Clear search query
     */
    onSearchClear() {
        if (!('search' in this.state.form)) {
            return;
        }

        delete this.state.form.search;
        this.requestTransactions(this.state.form);
    }

    async deleteItems() {
        if (this.state.loading) {
            return;
        }

        const ids = this.getContextIds();
        if (ids.length === 0) {
            return;
        }

        this.startLoading();

        try {
            await API.transaction.del({ id: ids });
            this.requestTransactions(this.state.form);
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
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
        this.state.form = {
            ...this.state.form,
            ...data,
        };

        this.requestTransactions(this.state.form);
    }

    onChangePage(page) {
        this.requestTransactions({
            ...this.state.form,
            page,
        });
    }

    onModeChanged(mode) {
        this.state.mode = mode;
        this.replaceHistory();
        this.render(this.state);
    }

    onItemSelect(itemId) {
        if (this.state.listMode === 'select') {
            this.toggleSelectItem(itemId);
        }
    }

    onContextMenu(itemId) {
        if (this.state.listMode === 'list') {
            this.showContextMenu(itemId);
        }
    }

    replaceHistory() {
        const url = this.getFilterURL();
        window.history.replaceState({}, PAGE_TITLE, url);
    }

    async requestTransactions(options) {
        this.startLoading();

        try {
            const result = await API.transaction.list(options);

            this.setState({
                ...this.state,
                items: [...result.data.items],
                pagination: { ...result.data.pagination },
                filter: { ...result.data.filter },
                form: { ...result.data.filter },
                listMode: 'list',
                contextItem: null,
            });
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');

            this.setState({
                ...this.state,
                form: { ...this.state.filter },
            });
        }

        this.replaceHistory();
        this.stopLoading();
        this.state.typingSearch = false;
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list') {
            this.contextMenu.detach();
            return;
        }

        const { contextItem } = state;
        if (!contextItem) {
            return;
        }
        const listItem = this.list.getListItemElementById(contextItem);
        if (!listItem) {
            return;
        }

        const menuContainer = listItem.querySelector('.actions-menu');
        if (!menuContainer) {
            return;
        }

        if (this.contextMenu.menuList.parentNode !== menuContainer) {
            PopupMenu.hideActive();
            this.contextMenu.attachTo(menuContainer);
            this.contextMenu.toggleMenu();
        }

        const { baseURL } = window.app;
        this.ctxUpdateBtn.setURL(`${baseURL}transactions/update/${contextItem}`);
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
        const isSelectMode = (state.listMode === 'select');
        const selectedItems = this.list.getSelectedItems();
        const totalSelCount = selectedItems.length;

        this.menu.show(itemsCount > 0);

        const selectModeTitle = (isSelectMode) ? 'Cancel' : 'Select';
        this.selectModeBtn.setTitle(selectModeTitle);
        this.selectModeBtn.setIcon((isSelectMode) ? null : 'select');
        show(this.separator1, isSelectMode);

        this.selectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount);
        this.deselectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount > 0);
        show(this.separator2, isSelectMode);

        this.deleteBtn.show(isSelectMode && totalSelCount > 0);
    }

    /** Render accounts selection */
    renderAccountsFilter(state) {
        const selectedAccounts = this.accountDropDown.getSelectedItems();
        const selectedIds = [];
        const idsToSelect = asArray(state.form.acc_id);
        selectedAccounts.forEach((accountItem) => {
            const itemId = parseInt(accountItem.id, 10);
            selectedIds.push(itemId);

            if (!idsToSelect.includes(itemId)) {
                this.accountDropDown.deselectItem(accountItem.id);
            }
        });
        idsToSelect.forEach((accountId) => {
            if (!selectedIds.includes(accountId)) {
                this.accountDropDown.selectItem(accountId.toString());
            }
        });
    }

    /** Render persons selection */
    renderPersonsFilter(state) {
        const selectedPersons = this.personDropDown.getSelectedItems();
        const selectedIds = [];
        const idsToSelect = asArray(state.form.person_id);
        selectedPersons.forEach((personItem) => {
            const itemId = parseInt(personItem.id, 10);
            selectedIds.push(itemId);

            if (!idsToSelect.includes(itemId)) {
                this.personDropDown.deselectItem(personItem.id);
            }
        });
        idsToSelect.forEach((personId) => {
            if (!selectedIds.includes(personId)) {
                this.personDropDown.selectItem(personId.toString());
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

        if (window.app.model.accounts.length > 0) {
            this.renderAccountsFilter(state);
        }
        if (window.app.model.persons.length > 0) {
            this.renderPersonsFilter(state);
        }

        // Render date
        const dateFilter = {
            stdate: (state.filter.stdate ?? null),
            enddate: (state.filter.enddate ?? null),
        };
        this.dateRangeFilter.setData(dateFilter);

        // Search form
        const isSearchFilter = !!state.form.search;
        if (!state.typingSearch) {
            this.searchInp.value = (isSearchFilter) ? state.form.search : '';
        }
        show(this.noSearchBtn, isSearchFilter);

        // Render list
        this.list.setMode(state.mode);
        this.list.setListMode(state.listMode);
        this.list.setItems(state.items);

        if (this.topPaginator && this.bottomPaginator) {
            this.topPaginator.show(state.items.length > 0);
            this.topPaginator.setURL(filterUrl);
            this.topPaginator.setPagesCount(state.pagination.pagesCount);
            this.topPaginator.setPage(state.pagination.page);

            this.bottomPaginator.show(state.items.length > 0);
            this.bottomPaginator.setURL(filterUrl);
            this.bottomPaginator.setPagesCount(state.pagination.pagesCount);
            this.bottomPaginator.setPage(state.pagination.page);
        }

        this.modeSelector.show(state.items.length > 0);
        this.modeSelector.setActive(state.mode);
        filterUrl.searchParams.set('page', state.pagination.page);
        this.modeSelector.setURL(filterUrl);

        this.renderContextMenu(state);
        this.renderMenu(state);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(TransactionListView);
