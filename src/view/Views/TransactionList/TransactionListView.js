import 'jezvejs/style';
import {
    ge,
    ce,
    show,
    isDate,
    urlJoin,
    isEmpty,
    insertAfter,
    prependChild,
    removeChilds,
    setEvents,
    setEmptyClick,
    ajax,
} from 'jezvejs';
import { formatDate } from 'jezvejs/DateUtils';
import { DropDown } from 'jezvejs/DropDown';
import { DatePicker } from 'jezvejs/DatePicker';
import { Paginator } from 'jezvejs/Paginator';
import { Sortable } from 'jezvejs/Sortable';
import { Selection } from 'jezvejs/Selection';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    createMessage,
} from '../../js/app.js';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import { Toolbar } from '../../Components/Toolbar/Toolbar.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import '../../css/app.css';
import '../../Components/TransactionTypeMenu/style.css';
import '../../Components/TransactionsList/style.css';
import './style.css';
import { TransactionListItem } from '../../Components/TransactionListItem/TransactionListItem.js';
import { ModeSelector } from '../../Components/ModeSelector/ModeSelector.js';

const PAGE_TITLE = 'Jezve Money | Transactions';
const MSG_NO_TRANSACTIONS = 'No transactions found.';
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

        this.model = {
            selDateRange: null,
        };

        this.state = {
            items: [...this.props.transArr],
            filter: { ...this.props.filterObj },
            pagination: { ...this.props.pagination },
            mode: this.props.mode,
            loading: false,
            renderTime: Date.now(),
            selectedItems: new Selection(),
        };
    }

    /**
     * View initialization
     */
    onStart() {
        this.clearAllBtn = ge('clearall_btn');
        this.clearAllBtn.addEventListener('click', (e) => this.onClearAllFilters(e));

        this.typeMenu = TransactionTypeMenu.fromElement(document.querySelector('.trtype-menu'), {
            allowActiveLink: true,
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });

        this.accountDropDown = DropDown.create({
            input_id: 'acc_id',
            placeholder: 'Select account',
            onchange: (obj) => this.onAccountChange(obj),
            editable: false,
            extraClass: 'dd__fullwidth',
        });
        if (!this.accountDropDown) {
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

        this.loadingIndicator = document.querySelector('.trans-list__loading');
        this.modeSelector = ModeSelector.fromElement(document.querySelector('.mode-selector'), {
            onChange: (mode) => this.onModeChanged(mode),
        });

        this.trListSortable = null;
        this.listItems = document.querySelector('.trans-list');
        if (this.listItems) {
            this.trListSortable = new Sortable({
                ondragstart: (elem) => this.onTransDragStart(elem),
                oninsertat: (elem, ref) => this.onTransPosChanged(elem, ref),
                container: this.listItems,
                group: 'transactions',
                selector: '.trans-list__item-wrapper',
                placeholderClass: 'trans-list__item-placeholder',
                copyWidth: true,
                table: (this.state.mode === 'details'),
            });

            /**
             * dragFrom is transaction id before transaction started to drag
             * 0 if drag first transaction, -1 if no draggin currently
             */
            this.trListSortable.dragFrom = -1;

            this.listItems.addEventListener('click', (e) => this.onTransClick(e));
        }

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
        this.state.renderTime = Date.now();
        this.render(this.state);
    }

    /**
     * Search for transaction by specified id
     * @param {number} transactionId - identifier of transaction
     */
    getTransaction(transactionId) {
        return this.state.items.find((item) => item && item.id === transactionId);
    }

    /**
     * Set position of transaction and update position and result balance of related transactions
     * @param {number} transactionId - identifier of transaction
     * @param {number} pos - new position of specified transaction
     */
    setPosition(transactionId, pos) {
        const posCompare = (a, b) => a.pos - b.pos;
        const initBalArr = [];
        const tBalanceArr = [];

        const trInfo = this.getTransaction(transactionId);
        if (!trInfo) {
            return false;
        }

        const oldPos = trInfo.pos;
        if (oldPos === pos) {
            return true;
        }

        this.state.items.sort(posCompare);
        this.state.items.forEach((transaction) => {
            const tr = transaction;
            if (tr.id === transactionId) {
                tr.pos = pos;
            } else if (oldPos === 0) {
                /* insert with specified position */
                if (tr.pos >= pos) {
                    tr.pos += 1;
                }
            } else if (pos < oldPos) {
                /* moving up */
                if (tr.pos >= pos && tr.pos < oldPos) {
                    tr.pos += 1;
                }
            } else if (pos > oldPos) {
                /* moving down */
                if (tr.pos > oldPos && tr.pos <= pos) {
                    tr.pos -= 1;
                }
            }

            if (tr.src_id && !(tr.src_id in initBalArr)) {
                initBalArr[tr.src_id] = tr.src_result + tr.src_amount;
            }

            if (tr.dest_id && !(tr.dest_id in initBalArr)) {
                initBalArr[tr.dest_id] = tr.dest_result - tr.dest_amount;
            }
        });

        // Sort array of transaction by position again
        this.state.items.sort(posCompare);

        if (this.state.mode === 'details') {
            this.state.items.forEach((transaction) => {
                const tr = transaction;
                const srcBalance = (tr.src_id !== 0 && tBalanceArr[tr.src_id] !== undefined)
                    ? tBalanceArr[tr.src_id]
                    : initBalArr[tr.src_id];
                const destBalance = (tr.dest_id !== 0 && tBalanceArr[tr.dest_id] !== undefined)
                    ? tBalanceArr[tr.dest_id]
                    : initBalArr[tr.dest_id];

                if (oldPos === 0) {
                    /* insert with specified position */
                    if (tr.pos >= pos) {
                        this.updateBalance(tr, srcBalance, destBalance);
                    }
                } else if (pos < oldPos) {
                    /* moving up */
                    if (tr.pos >= pos && tr.pos <= oldPos) {
                        this.updateBalance(tr, srcBalance, destBalance);
                    }
                } else if (pos > oldPos) {
                    /* moving down */
                    if (tr.pos >= oldPos && tr.pos <= pos) {
                        this.updateBalance(tr, srcBalance, destBalance);
                    }
                }

                tBalanceArr[tr.src_id] = tr.src_result;
                tBalanceArr[tr.dest_id] = tr.dest_result;
            });
        }

        return true;
    }

    /**
     *
     * @param {object} transaction - transaction object
     * @param {number} srcBal - source balance
     * @param {number} destBal - destination balance
     */
    updateBalance(transaction, srcBal, destBal) {
        let sourceBalance = srcBal;
        let destBalance = destBal;
        const tr = transaction;

        if (!tr) {
            return;
        }

        if (tr.src_id !== 0) {
            if (sourceBalance === null) {
                sourceBalance = tr.src_result + tr.src_amount;
            }
            tr.src_result = sourceBalance - tr.src_amount;
        } else {
            tr.src_result = 0;
        }

        if (tr.dest_id !== 0) {
            if (destBalance === null) {
                destBalance = tr.dest_result - tr.dest_amount;
            }
            tr.dest_result = destBalance + tr.dest_amount;
        } else {
            tr.dest_result = 0;
        }

        const transItemElem = this.findListItemById(tr.id);
        if (!transItemElem) {
            return;
        }
        const transBalanceItem = transItemElem.querySelector('.tritem_balance');
        if (!transBalanceItem) {
            return;
        }

        removeChilds(transBalanceItem);

        const currencyModel = window.app.model.currency;

        if (tr.type === EXPENSE
            || tr.type === TRANSFER
            || (tr.type === DEBT && tr.src_id !== 0)) {
            const balSpan = ce('span');
            balSpan.textContent = currencyModel.formatCurrency(
                tr.src_result,
                tr.src_curr,
            );
            transBalanceItem.appendChild(balSpan);
        }

        if (tr.type === INCOME
            || tr.type === TRANSFER
            || (tr.type === DEBT && tr.dest_id !== 0)) {
            const balSpan = ce('span');
            balSpan.textContent = currencyModel.formatCurrency(
                tr.dest_result,
                tr.dest_curr,
            );
            transBalanceItem.appendChild(balSpan);
        }
    }

    /**
     * Look for list item with specified identifier
     * @param {number} id - transaction identifier
     */
    findListItemById(id) {
        return this.listItems.querySelector(`[data-id="${id}"]`);
    }

    /**
     * Transaction block click event handler
     * @param {Event} e - click event object
     */
    onTransClick(e) {
        const listItemElem = this.findListItemElement(e.target);
        if (!listItemElem || !listItemElem.dataset) {
            return;
        }

        const transactionId = parseInt(listItemElem.dataset.id, 10);
        const transaction = this.getTransaction(transactionId);
        if (!transaction) {
            return;
        }

        if (this.state.selectedItems.isSelected(transactionId)) {
            this.state.selectedItems.deselect(transactionId);
        } else {
            this.state.selectedItems.select(transactionId);
        }

        this.render(this.state);
    }

    /**
     * Sent AJAX request to server to change position of transaction
     * @param {number} transactionId - identifier of transaction to change position
     * @param {number} newPos  - new position of transaction
     */
    sendChangePosRequest(transactionId, newPos) {
        const { baseURL } = window.app;

        ajax.post({
            url: `${baseURL}api/transaction/setpos`,
            data: JSON.stringify({
                id: transactionId,
                pos: newPos,
            }),
            headers: { 'Content-Type': 'application/json' },
            callback: this.onChangePosCallback(transactionId, newPos),
        });
    }

    /**
     * Return callback function for position change request
     * @param {number} transactionId - identifier of transaction to change position
     * @param {number} newPos - new position of transaction
     */
    onChangePosCallback(transactionId, newPos) {
        return (response) => {
            const res = JSON.parse(response);
            if (res && res.result === 'ok') {
                this.updateTransArrPos(transactionId, newPos);
            } else {
                this.cancelPosChange(transactionId);
            }
        };
    }

    /**
     * Update local transactions array on successfull result from server
     * @param {number} transactionId - identifier of transaction to change position
     * @param {number} newPos - new position of transaction
     */
    updateTransArrPos(transactionId, newPos) {
        this.setPosition(transactionId, newPos);
    }

    /**
     * Cancel local changes on transaction position update fail
     * @param {number} trans_id - identifier of transaction
     */
    cancelPosChange(transactionId) {
        if (!this.trListSortable || this.trListSortable.dragFrom === -1) {
            return;
        }

        const origTr = this.findListItemById(transactionId);
        if (!origTr || !origTr.parentNode) {
            return;
        }

        const origWrap = origTr.parentNode;
        if (this.trListSortable.dragFrom === 0) {
            prependChild(origWrap.parentNode, origWrap);
        } else {
            const trBefore = this.findListItemById(this.trListSortable.dragFrom);
            if (!trBefore || !trBefore.parentNode) {
                return;
            }

            const trBeforeWrap = trBefore.parentNode;
            insertAfter(origWrap, trBeforeWrap);
        }

        createMessage(MSG_SET_POS_FAIL, 'msg_error');
    }

    /**
     * Find closest list item element to specified
     * @param {Element} elem - element to start looking from
     */
    findListItemElement(elem) {
        const selector = (this.state.mode === 'details') ? 'tr' : '.trans-list__item';

        if (!elem) {
            return null;
        }

        const res = elem.querySelector(selector);
        if (!res) {
            return elem.closest(selector);
        }

        return res;
    }

    /**
     * Return transaction id from transaction item element
     * @param {Element} elem - target list item element
     */
    transIdFromElem(elem) {
        const listItemElem = this.findListItemElement(elem);
        if (!listItemElem || !listItemElem.dataset) {
            return 0;
        }

        return parseInt(listItemElem.dataset.id, 10);
    }

    /**
     * Transaction drag start event handler
     * @param {Element} elem - transaction list item element
     */
    onTransDragStart(elem) {
        if (!this.trListSortable || !elem) {
            return;
        }

        const prevElem = elem.previousElementSibling;
        this.trListSortable.dragFrom = this.transIdFromElem(prevElem);
    }

    /**
     * Transaction item drop callback
     * @param {number} trans_id - identifier of moving transaction
     * @param {number} retrans_id - identifier of replaced transaction
     */
    onTransPosChanged(elem, refElem) {
        const transactionId = this.transIdFromElem(elem);
        const refId = this.transIdFromElem(refElem);
        if (!transactionId || !refId) {
            return;
        }

        const replacedItem = this.getTransaction(refId);
        if (replacedItem) {
            this.sendChangePosRequest(transactionId, replacedItem.pos);
        }
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
        if (this.state.selectedItems.count() === 0) {
            return;
        }

        const multi = (this.state.selectedItems.count() > 1);
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

        this.model.selDateRange = range;
        this.datePicker.hide();
        const start = formatDate(range.start);
        const end = formatDate(range.end);

        this.dateInput.value = `${start} - ${end}`;
    }

    /**
     * Date picker hide callback
     */
    onDatePickerHide() {
        if (!this.model.selDateRange) {
            return;
        }

        const newStartDate = formatDate(this.model.selDateRange.start);
        const newEndDate = formatDate(this.model.selDateRange.end);

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

        setEmptyClick(() => this.datePicker.hide(), [
            this.datePickerWrapper,
            this.datePickerBtn.elem,
            this.dateInputBtn,
        ]);
    }

    onChangePage(page) {
        this.requestTransactions({
            ...this.state.filter,
            page,
        });
    }

    onModeChanged(mode) {
        this.state.mode = mode;
        this.state.renderTime = Date.now();
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

    requestTransactions(options) {
        const { baseURL } = window.app;
        const reqOptions = {
            ...options,
            order: 'desc',
        };
        const apiReq = `${baseURL}api/transaction/list?${urlJoin(reqOptions)}`;

        this.startLoading();

        ajax.get({
            url: apiReq,
            headers: { 'Content-Type': 'application/json' },
            callback: (resp) => this.onTransactionsCallback(resp),
        });
    }

    onTransactionsCallback(response) {
        const res = JSON.parse(response);
        if (!res || res.result !== 'ok') {
            return;
        }

        this.state.selectedItems.clear();
        this.state.items = [...res.data.items];
        this.state.pagination = { ...res.data.pagination };
        this.state.filter = { ...res.data.filter };

        this.replaceHistory();

        this.stopLoading();
    }

    render(state) {
        if (state.loading) {
            show(this.loadingIndicator, true);
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

        // Render accounts selection
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

        // Render date
        const dateSubtitle = (state.filter.stdate && state.filter.enddate)
            ? `${state.filter.stdate} - ${state.filter.enddate}`
            : null;
        this.datePickerBtn.setSubtitle(dateSubtitle);

        // Render list
        const elems = state.items.map((item) => {
            const tritem = TransactionListItem.create({
                mode: state.mode,
                selected: state.selectedItems.isSelected(item.id),
                item,
            });
            tritem.render(tritem.state);
            return tritem.elem;
        });

        removeChilds(this.listItems);
        if (elems.length) {
            const itemsContainer = (state.mode === 'details')
                ? ce('table', { className: 'trans-list-items' }, elems)
                : ce('div', { className: 'trans-list-items' }, elems);

            this.listItems.appendChild(itemsContainer);
            if (state.mode === 'details') {
                this.listItems.classList.add('trans-list_details');
            } else {
                this.listItems.classList.remove('trans-list_details');
            }
        } else {
            this.listItems.appendChild(ce('span', {
                className: 'nodata-message',
                textContent: MSG_NO_TRANSACTIONS,
            }));
        }
        this.listItems.dataset.time = state.renderTime;

        if (this.topPaginator && this.bottomPaginator) {
            this.topPaginator.show(elems.length > 0);
            this.topPaginator.setURL(filterUrl);
            this.topPaginator.setPagesCount(state.pagination.pagesCount);
            this.topPaginator.setPage(state.pagination.page);

            this.bottomPaginator.show(elems.length > 0);
            this.bottomPaginator.setURL(filterUrl);
            this.bottomPaginator.setPagesCount(state.pagination.pagesCount);
            this.bottomPaginator.setPage(state.pagination.page);
        }

        this.modeSelector.show(elems.length > 0);
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
        this.toolbar.updateBtn.show(state.selectedItems.count() === 1);
        this.toolbar.deleteBtn.show(state.selectedItems.count() > 0);

        const selArr = state.selectedItems.getIdArray();
        this.delTransInp.value = selArr.join();

        if (state.selectedItems.count() === 1) {
            const { baseURL } = window.app;
            this.toolbar.updateBtn.setURL(`${baseURL}transactions/update/${selArr[0]}`);
        }

        this.toolbar.show(state.selectedItems.count() > 0);

        if (!state.loading) {
            show(this.loadingIndicator, false);
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(TransactionListView);
