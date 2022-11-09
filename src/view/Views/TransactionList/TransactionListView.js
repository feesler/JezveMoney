import 'jezvejs/style';
import {
    ge,
    createElement,
    show,
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
import { SearchInput } from '../../Components/SearchInput/SearchInput.js';

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
/* 'Show more' button */
const TITLE_SHOW_MORE = 'Show more...';

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

        // Date range filter
        this.dateRangeFilter = DateRangeInput.fromElement(ge('dateFrm'), {
            startPlaceholder: START_DATE_PLACEHOLDER,
            endPlaceholder: END_DATE_PLACEHOLDER,
            onChange: (data) => this.onChangeDateFilter(data),
        });

        // Search input
        this.searchFilter = ge('searchFilter');
        this.searchHandler = throttle((val) => this.onSearchInputChange(val), SEARCH_THROTTLE);
        this.searchInput = SearchInput.create({
            placeholder: 'Type to filter',
            onChange: this.searchHandler,
        });
        this.searchFilter.append(this.searchInput.elem);

        this.listContainer = document.querySelector('.list-container');
        this.loadingIndicator = LoadingIndicator.create();
        this.listContainer.append(this.loadingIndicator.elem);

        // List mode selected
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
        listHeader.append(this.modeSelector.elem);

        // Transactions list
        this.list = TransactionList.create({
            listMode: 'list',
            onItemClick: (id, e) => this.onItemClick(id, e),
            onSort: (id, pos) => this.sendChangePosRequest(id, pos),
        });
        insertAfter(this.list.elem, listHeader);

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
            onChange: (page) => this.onChangePage(page),
        });
        listFooter.append(this.paginator.elem);

        this.createBtn = ge('add_btn');
        this.createMenu();
        insertAfter(this.menu.elem, this.createBtn);

        this.createContextMenu();

        this.render(this.state);
    }

    createMenu() {
        this.menu = PopupMenu.create({ id: 'listMenu' });

        this.listModeBtn = this.menu.addIconItem({
            id: 'listModeBtn',
            title: 'Done',
            onClick: () => this.setListMode('list'),
        });
        this.selectModeBtn = this.menu.addIconItem({
            id: 'selectModeBtn',
            icon: 'select',
            title: 'Select',
            onClick: () => this.setListMode('select'),
        });
        this.sortModeBtn = this.menu.addIconItem({
            id: 'sortModeBtn',
            icon: 'sort',
            title: 'Sort',
            onClick: () => this.setListMode('sort'),
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
            attached: true,
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

    setListMode(listMode) {
        if (this.state.listMode === listMode) {
            return;
        }

        let newState = {
            ...this.state,
            listMode,
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
        const data = asArray(obj);
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

    /** Search field input event handler */
    onSearchInputChange(value) {
        if (this.state.form.search === value) {
            return;
        }

        if (value.length > 0) {
            this.state.form.search = value;
        } else if ('search' in this.state.form) {
            delete this.state.form.search;
        }

        this.state.typingSearch = true;

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

    showMore() {
        const { page } = this.state.pagination;
        let { range } = this.state.pagination;
        if (!range) {
            range = 1;
        }
        range += 1;

        this.requestTransactions({
            ...this.state.form,
            range,
            page,
        });
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

    onItemClick(itemId, e) {
        if (this.state.listMode === 'list') {
            const menuBtn = e?.target?.closest('.actions-menu-btn');
            if (menuBtn) {
                this.showContextMenu(itemId);
            }
        } else if (this.state.listMode === 'select') {
            if (e?.target?.closest('.checkbox')) {
                e.preventDefault();
            }

            this.toggleSelectItem(itemId);
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
        const itemId = state.contextItem;
        if (!itemId) {
            return;
        }
        const listItem = this.list.getListItemById(itemId);
        const menuContainer = listItem?.elem?.querySelector('.actions-menu');
        if (!menuContainer) {
            return;
        }

        if (this.contextMenu.menuList.parentNode !== menuContainer) {
            PopupMenu.hideActive();
            this.contextMenu.attachTo(menuContainer);
            this.contextMenu.toggleMenu();
        }

        const { baseURL } = window.app;
        this.ctxUpdateBtn.setURL(`${baseURL}transactions/update/${itemId}`);
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
        const isListMode = state.listMode === 'list';
        const isSelectMode = (state.listMode === 'select');
        const selectedItems = this.list.getSelectedItems();
        const totalSelCount = selectedItems.length;

        this.menu.show(itemsCount > 0);

        this.listModeBtn.show(!isListMode);
        this.selectModeBtn.show(isListMode && itemsCount > 0);
        this.sortModeBtn.show(isListMode && itemsCount > 1);

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
            this.searchInput.value = (isSearchFilter) ? state.form.search : '';
        }

        // Render list
        this.list.setState((listState) => ({
            ...listState,
            mode: state.mode,
            listMode: state.listMode,
            showControls: (state.listMode === 'list'),
            items: state.items,
            renderTime: Date.now(),
        }));

        if (this.paginator) {
            this.paginator.show(state.items.length > 0);
            const range = state.pagination.range ?? 1;
            this.paginator.setState((paginatorState) => ({
                ...paginatorState,
                url: filterUrl,
                pagesCount: state.pagination.pagesCount,
                pageNum: state.pagination.page + range - 1,
            }));
        }

        show(
            this.showMoreBtn,
            state.items.length > 0 && state.pagination.page < state.pagination.pagesCount,
        );

        filterUrl.searchParams.set('page', state.pagination.page);
        this.modeSelector.show(state.items.length > 0);
        this.modeSelector.setActive(state.mode);
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
