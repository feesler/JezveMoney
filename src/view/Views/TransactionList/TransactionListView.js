import 'jezvejs/style';
import {
    ge,
    show,
    isDate,
    urlJoin,
    isEmpty,
    setEvents,
} from 'jezvejs';
import { Collapsible } from 'jezvejs/Collapsible';
import { formatDate } from 'jezvejs/DateUtils';
import { DropDown } from 'jezvejs/DropDown';
import { DatePicker } from 'jezvejs/DatePicker';
import { Paginator } from 'jezvejs/Paginator';
import { createMessage } from '../../js/app.js';
import { Application } from '../../js/Application.js';
import { API } from '../../js/API.js';
import { View } from '../../js/View.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import { Toolbar } from '../../Components/Toolbar/Toolbar.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import '../../css/app.css';
import './style.css';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { ModeSelector } from '../../Components/ModeSelector/ModeSelector.js';

const PAGE_TITLE = 'Jezve Money | Transactions';
const MSG_SET_POS_FAIL = 'Fail to change position of transaction.';
const TITLE_SINGLE_TRANS_DELETE = 'Delete transaction';
const TITLE_MULTI_TRANS_DELETE = 'Delete transactions';
const MSG_MULTI_TRANS_DELETE = 'Are you sure want to delete selected transactions?<br>Changes in the balance of affected accounts will be canceled.';
const MSG_SINGLE_TRANS_DELETE = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';

/**
 * List of transactions view
 */
class TransactionListView extends View {
    constructor(...args) {
        super(...args);

        this.state = {
            items: [...this.props.transArr],
            filter: { ...this.props.filterObj },
            pagination: { ...this.props.pagination },
            mode: this.props.mode,
            loading: false,
            selDateRange: null,
        };
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

        this.typeMenu = TransactionTypeMenu.fromElement(document.querySelector('.trtype-menu'), {
            allowActiveLink: true,
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });

        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            placeholder: 'Select account',
            onchange: (obj) => this.onAccountChange(obj),
            editable: false,
            className: 'dd__fullwidth',
        });
        if (!this.accountDropDown) {
            throw new Error('Failed to initialize Transaction List view');
        }

        this.personDropDown = DropDown.create({
            elem: 'person_id',
            placeholder: 'Select person',
            onchange: (obj) => this.onPersonChange(obj),
            editable: false,
            className: 'dd__fullwidth',
        });
        if (!this.personDropDown) {
            throw new Error('Failed to initialize Transaction List view');
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

        this.noSearchBtn = ge('nosearchbtn');
        if (!this.noSearchBtn) {
            throw new Error('Failed to initialize Transaction List view');
        }
        setEvents(this.noSearchBtn, { click: () => this.onSearchClear() });

        this.datePickerBtn = IconLink.fromElement({
            elem: 'calendar_btn',
            onclick: () => this.showCalendar(),
        });
        this.dateBlock = ge('date_block');
        this.datePickerWrapper = ge('calendar');

        this.dateInputBtn = ge('cal_rbtn');
        if (this.dateInputBtn) {
            this.dateInputBtn.addEventListener('click', () => this.showCalendar());
        }
        this.dateInput = ge('date');

        this.noDateBtn = ge('nodatebtn');
        if (!this.noDateBtn) {
            throw new Error('Failed to initialize Transaction List view');
        }
        setEvents(this.noDateBtn, { click: () => this.onDateClear() });

        this.delForm = ge('delform');
        this.delTransInp = ge('deltrans');
        if (!this.delForm || !this.delTransInp) {
            throw new Error('Failed to initialize Transaction List view');
        }

        const listContainer = document.querySelector('.list-container');
        this.loadingIndicator = LoadingIndicator.create();
        listContainer.append(this.loadingIndicator.elem);

        this.modeSelector = ModeSelector.fromElement(document.querySelector('.mode-selector'), {
            onChange: (mode) => this.onModeChanged(mode),
        });

        this.list = TransactionList.create({
            elem: document.querySelector('.trans-list'),
            selectable: true,
            onSelect: () => this.render(this.state),
            sortable: true,
            onSort: (id, pos) => this.sendChangePosRequest(id, pos),
        });

        const paginatorElems = document.querySelectorAll('.paginator');
        if (paginatorElems.length !== 2) {
            throw new Error('Failed to initialize Transaction List view');
        }
        const paginatorOptions = {
            onChange: (page) => this.onChangePage(page),
        };

        this.topPaginator = Paginator.fromElement(paginatorElems[0], paginatorOptions);
        this.bottomPaginator = Paginator.fromElement(paginatorElems[1], paginatorOptions);

        this.toolbar = Toolbar.create({
            elem: 'toolbar',
            ondelete: () => this.confirmDelete(),
        });

        this.render(this.state);
    }

    /** Set loading state and render view */
    startLoading() {
        this.state.loading = true;
        this.render(this.state);
    }

    /** Remove loading state and render view */
    stopLoading() {
        this.state.loading = false;
        this.render(this.state);
    }

    /**
     * Sent AJAX request to server to change position of transaction
     * @param {number} transactionId - identifier of transaction to change position
     * @param {number} newPos  - new position of transaction
     */
    async sendChangePosRequest(transactionId, newPos) {
        try {
            await API.transaction.setPos(transactionId, newPos);
            this.list.setPosition(transactionId, newPos);
        } catch (e) {
            this.cancelPosChange(transactionId);
        }
    }

    /**
     * Cancel local changes on transaction position update fail
     * @param {number} trans_id - identifier of transaction
     */
    cancelPosChange() {
        this.render(this.state);

        createMessage(MSG_SET_POS_FAIL, 'msg_error');
    }

    /**
     * Build new location address from current filterObj
     */
    buildAddress() {
        const { baseURL } = window.app;
        let newLocation = `${baseURL}transactions/`;
        const locFilter = { ...this.state.filter };

        if ('type' in locFilter) {
            if (!Array.isArray(locFilter.type)) {
                locFilter.type = [locFilter.type];
            }

            if (!locFilter.type.length) {
                delete locFilter.type;
            }
        }

        if ('acc_id' in locFilter) {
            if (!Array.isArray(locFilter.acc_id)) {
                locFilter.acc_id = [locFilter.acc_id];
            }

            if (!locFilter.acc_id.length) {
                delete locFilter.acc_id;
            }
        }

        if ('person_id' in locFilter) {
            if (!Array.isArray(locFilter.person_id)) {
                locFilter.person_id = [locFilter.person_id];
            }

            if (!locFilter.person_id.length) {
                delete locFilter.person_id;
            }
        }

        if (!isEmpty(locFilter)) {
            newLocation += `?${urlJoin(locFilter)}`;
        }

        return newLocation;
    }

    /**
     * Clear all filters
     * @param {Event} e - click event object
     */
    onClearAllFilters(e) {
        e.stopPropagation();
        e.preventDefault();

        this.state.filter = {};
        this.state.pagination.page = 1;

        this.requestTransactions(this.state.filter);
    }

    /**
     * Transaction type menu change event handler
     */
    onChangeTypeFilter(selected) {
        this.state.filter.type = selected;
        this.requestTransactions(this.state.filter);
    }

    /**
     * Account change event handler
     * @param {object} obj - selection object
     */
    onAccountChange(obj) {
        // Check all accounts from the new selection present in current selection
        const data = Array.isArray(obj) ? obj : [obj];
        let reloadNeeded = data.some((item) => {
            const id = parseInt(item.id, 10);

            return (
                !this.state.filter.acc_id
                || !this.state.filter.acc_id.includes(id)
            );
        });

        // Check all currenlty selected accounts present in the new selection
        if (!reloadNeeded) {
            reloadNeeded = this.state.filter.acc_id.some(
                (accountId) => !data.find((item) => item.id === accountId),
            );
        }

        if (!reloadNeeded) {
            return;
        }

        // Prepare parameters
        this.state.filter.acc_id = data.map((item) => parseInt(item.id, 10));
        this.requestTransactions(this.state.filter);
    }

    /**
     * Persons filter change event handler
     * @param {object} obj - selection object
     */
    onPersonChange(obj) {
        // Check all persons from the new selection present in current selection
        const data = Array.isArray(obj) ? obj : [obj];
        let reloadNeeded = data.some((item) => {
            const id = parseInt(item.id, 10);

            return (
                !this.state.filter.person_id
                || !this.state.filter.person_id.includes(id)
            );
        });

        // Check all currenlty selected persons present in the new selection
        if (!reloadNeeded) {
            reloadNeeded = this.state.filter.person_id.some(
                (personId) => !data.find((item) => item.id === personId),
            );
        }

        if (!reloadNeeded) {
            return;
        }

        // Prepare parameters
        this.state.filter.person_id = data.map((item) => parseInt(item.id, 10));
        this.requestTransactions(this.state.filter);
    }

    /**
     * Transaction search form submit event handler
     * @param {Event} e - submit event
     */
    onSearchSubmit(e) {
        e.preventDefault();

        if (!this.searchInp) {
            return;
        }

        if (this.searchInp.value.length) {
            this.state.filter.search = this.searchInp.value;
        } else if ('search' in this.state.filter) {
            delete this.state.filter.search;
        }

        this.requestTransactions(this.state.filter);
    }

    /**
     * Clear search query
     */
    onSearchClear() {
        if (!('search' in this.state.filter)) {
            return;
        }

        delete this.state.filter.search;
        this.requestTransactions(this.state.filter);
    }

    /**
     * Create and show transaction delete warning popup
     */
    confirmDelete() {
        if (this.list.selectedItems.count() === 0) {
            return;
        }

        const multi = (this.list.selectedItems.count() > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multi) ? TITLE_MULTI_TRANS_DELETE : TITLE_SINGLE_TRANS_DELETE,
            content: (multi) ? MSG_MULTI_TRANS_DELETE : MSG_SINGLE_TRANS_DELETE,
            onconfirm: () => this.delForm.submit(),
        });
    }

    /**
     * Date range select calback
     * @param {object} range - selected range object
     */
    onRangeSelect(range) {
        if (!range || !isDate(range.start) || !isDate(range.end)) {
            return;
        }

        this.state.selDateRange = range;
        this.datePicker.hide();
        const start = formatDate(range.start);
        const end = formatDate(range.end);

        this.dateInput.value = `${start} - ${end}`;
    }

    /**
     * Date picker hide callback
     */
    onDatePickerHide() {
        if (!this.state.selDateRange) {
            return;
        }

        const newStartDate = formatDate(this.state.selDateRange.start);
        const newEndDate = formatDate(this.state.selDateRange.end);

        if (this.state.filter.stdate === newStartDate
            && this.state.filter.enddate === newEndDate) {
            return;
        }

        this.state.filter.stdate = newStartDate;
        this.state.filter.enddate = newEndDate;

        this.requestTransactions(this.state.filter);
    }

    /**
     * Clear date range query
     */
    onDateClear() {
        if (!('stdate' in this.state.filter) && !('enddate' in this.state.filter)) {
            return;
        }

        delete this.state.filter.stdate;
        delete this.state.filter.enddate;
        this.requestTransactions(this.state.filter);
    }

    /**
     * Show calendar block
     */
    showCalendar() {
        if (!this.datePicker) {
            this.datePicker = DatePicker.create({
                wrapper: this.datePickerWrapper,
                relparent: this.datePickerWrapper.parentNode,
                locales: 'en',
                range: true,
                onrangeselect: (range) => this.onRangeSelect(range),
                onhide: () => this.onDatePickerHide(),
            });
        }
        if (!this.datePicker) {
            return;
        }

        const isVisible = this.datePicker.visible();
        if (!isVisible) {
            this.datePicker.setSelection(this.state.filter.stdate, this.state.filter.enddate);
        }

        this.datePicker.show(!isVisible);

        this.datePickerBtn.hide();
        show(this.dateBlock, true);
    }

    onChangePage(page) {
        this.requestTransactions({
            ...this.state.filter,
            page,
        });
    }

    onModeChanged(mode) {
        this.state.mode = mode;
        this.replaceHistory();
        this.render(this.state);
    }

    replaceHistory() {
        const url = new URL(this.buildAddress());
        url.searchParams.set('page', this.state.pagination.page);
        if (this.state.mode === 'details') {
            url.searchParams.set('mode', 'details');
        } else {
            url.searchParams.delete('mode');
        }
        window.history.replaceState({}, PAGE_TITLE, url);
    }

    async requestTransactions(options) {
        this.startLoading();

        try {
            const result = await API.transaction.list(options);

            this.state.items = [...result.data.items];
            this.state.pagination = { ...result.data.pagination };
            this.state.filter = { ...result.data.filter };
        } catch (e) {
            return;
        }

        this.replaceHistory();
        this.stopLoading();
    }

    /** Render accounts selection */
    renderAccountsFilter(state) {
        const selectedAccounts = this.accountDropDown.getSelectedItems();
        const selectedIds = [];
        const idsToSelect = Array.isArray(state.filter.acc_id) ? state.filter.acc_id : [];
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
        const idsToSelect = Array.isArray(state.filter.person_id) ? state.filter.person_id : [];
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

        const filterUrl = new URL(this.buildAddress());
        filterUrl.searchParams.delete('page');
        if (state.mode === 'details') {
            filterUrl.searchParams.set('mode', 'details');
        } else {
            filterUrl.searchParams.delete('mode');
        }

        this.typeMenu.setURL(filterUrl);
        this.typeMenu.setSelection(state.filter.type);

        this.renderAccountsFilter(state);
        this.renderPersonsFilter(state);

        // Render date
        const dateSubtitle = (state.filter.stdate && state.filter.enddate)
            ? `${state.filter.stdate} - ${state.filter.enddate}`
            : null;
        this.datePickerBtn.setSubtitle(dateSubtitle);

        // Render list
        this.list.setMode(state.mode);
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
        this.modeSelector.setMode(state.mode);
        filterUrl.searchParams.set('page', state.pagination.page);
        this.modeSelector.setURL(filterUrl);

        // Date range
        if (this.state.filter.stdate && this.state.filter.enddate) {
            const start = this.state.filter.stdate;
            const end = this.state.filter.enddate;

            this.dateInput.value = `${start} - ${end}`;
        } else {
            this.dateInput.value = '';
        }

        // Search form
        this.searchInp.value = (this.state.filter.search) ? this.state.filter.search : '';

        // toolbar
        this.toolbar.updateBtn.show(this.list.selectedItems.count() === 1);
        this.toolbar.deleteBtn.show(this.list.selectedItems.count() > 0);

        const selArr = this.list.selectedItems.getIdArray();
        this.delTransInp.value = selArr.join();

        if (this.list.selectedItems.count() === 1) {
            const { baseURL } = window.app;
            this.toolbar.updateBtn.setURL(`${baseURL}transactions/update/${selArr[0]}`);
        }

        this.toolbar.show(this.list.selectedItems.count() > 0);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(TransactionListView);
