'use strict';

/* global ge, ce, show, isDate, urlJoin, isEmpty, insertAfter, createMessage, setEmptyClick */
/* global extend, prependChild, removeChilds, ajax, baseURL, setParam */
/* global EXPENSE, INCOME, TRANSFER, DEBT */
/* global DropDown, DatePicker, IconLink, Sortable, ConfirmDialog, Toolbar, View */

var singleTransDeleteTitle = 'Delete transaction';
var multiTransDeleteTitle = 'Delete transactions';
var multiTransDeleteMsg = 'Are you sure want to delete selected transactions?<br>Changes in the balance of affected accounts will be canceled.';
var singleTransDeleteMsg = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';

/**
 * List of transactions view
 */
function TransactionListView() {
    TransactionListView.parent.constructor.apply(this, arguments);

    this.model = {
        selection: new Selection(),
        selDateRange: null
    };
}

extend(TransactionListView, View);

/**
 * View initialization
 */
TransactionListView.prototype.onStart = function () {
    this.typeMenu = document.querySelector('.trtype-menu');
    if (!this.typeMenu) {
        throw new Error('Failed to initialize Transaction List view');
    }
    this.typeMenu.addEventListener('click', this.onToggleTransType.bind(this));

    this.accountDropDown = DropDown.create({
        input_id: 'acc_id',
        placeholder: 'Select account',
        onchange: this.onAccountChange.bind(this),
        editable: false,
        extraClass: 'dd__fullwidth'
    });
    if (!this.accountDropDown) {
        throw new Error('Failed to initialize Transaction List view');
    }

    this.searchFrm = ge('searchFrm');
    if (!this.searchFrm) {
        throw new Error('Failed to initialize Transaction List view');
    }
    this.searchFrm.addEventListener('submit', this.onSearchSubmit.bind(this));

    this.searchInp = ge('search');
    if (!this.searchInp) {
        throw new Error('Failed to initialize Transaction List view');
    }
    this.searchInp.inputMode = 'search';

    this.datePickerBtn = IconLink.fromElement({
        elem: 'calendar_btn',
        onclick: this.showCalendar.bind(this)
    });
    this.dateBlock = ge('date_block');
    this.datePickerWrapper = ge('calendar');

    this.dateInputBtn = ge('cal_rbtn');
    if (this.dateInputBtn) {
        this.dateInputBtn.addEventListener('click', this.showCalendar.bind(this));
    }
    this.dateInput = ge('date');

    this.delForm = ge('delform');
    this.delTransInp = ge('deltrans');
    if (!this.delForm || !this.delTransInp) {
        throw new Error('Failed to initialize Transaction List view');
    }

    this.trListSortable = null;
    this.listItems = ge('tritems');
    if (this.listItems) {
        this.trListSortable = new Sortable({
            ondragstart: this.onTransDragStart.bind(this),
            oninsertat: this.onTransPosChanged.bind(this),
            container: 'tritems',
            group: 'transactions',
            selector: '.trans-list__item-wrapper',
            placeholderClass: 'trans-list__item-placeholder',
            copyWidth: true,
            table: (this.props.filterObj.mode === 'details')
        });

        /**
         * dragFrom is transaction id before transaction started to drag
         * 0 if drag first transaction, -1 if no draggin currently
         */
        this.trListSortable.dragFrom = -1;

        this.listItems.addEventListener('click', this.onTransClick.bind(this));
    }

    this.toolbar = Toolbar.create({
        elem: 'toolbar',
        ondelete: this.confirmDelete.bind(this)
    });
};

/**
 * Search for transaction by specified id
 * @param {number} transactionId - identifier of transaction
 */
TransactionListView.prototype.getTransaction = function (transactionId) {
    return this.props.transArr.find(function (item) {
        return item && item.id === transactionId;
    });
};

/**
 * Set position of transaction and update position and result balance of related transactions
 * @param {number} transactionId - identifier of transaction
 * @param {number} pos - new position of specified transaction
 */
TransactionListView.prototype.setPosition = function (transactionId, pos) {
    var trInfo;
    var oldPos;
    var initBalArr = [];
    var tBalanceArr = [];

    function posCompare(tr1, tr2) {
        if (tr1.pos < tr2.pos) {
            return -1;
        }
        if (tr1.pos > tr2.pos) {
            return 1;
        }

        return 0;
    }

    trInfo = this.getTransaction(transactionId);
    if (!trInfo) {
        return false;
    }

    oldPos = trInfo.pos;
    if (oldPos === pos) {
        return true;
    }

    this.props.transArr.sort(posCompare);
    this.props.transArr.forEach(function (transaction) {
        var tr = transaction;
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

    // Sort array of  transaction by position again
    this.props.transArr.sort(posCompare);

    if (this.props.filterObj.mode === 'details') {
        this.props.transArr.forEach(function (transaction) {
            var tr = transaction;
            var srcBalance = (tr.src_id !== 0 && tBalanceArr[tr.src_id] !== undefined)
                ? tBalanceArr[tr.src_id]
                : initBalArr[tr.src_id];
            var destBalance = (tr.dest_id !== 0 && tBalanceArr[tr.dest_id] !== undefined)
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
        }, this);
    }

    return true;
};

/**
 *
 * @param {object} transaction - transaction object
 * @param {number} srcBal - source balance
 * @param {number} destBal - destination balance
 */
TransactionListView.prototype.updateBalance = function (transaction, srcBal, destBal) {
    var transItemElem;
    var transBalanceItem;
    var balSpan;
    var sourceBalance = srcBal;
    var destBalance = destBal;
    var tr = transaction;

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

    transItemElem = this.findListItemById(tr.id);
    if (!transItemElem) {
        return;
    }
    transBalanceItem = transItemElem.querySelector('.tritem_balance');
    if (!transBalanceItem) {
        return;
    }

    removeChilds(transBalanceItem);

    if (tr.type === EXPENSE
        || tr.type === TRANSFER
        || (tr.type === DEBT && tr.src_id !== 0)
    ) {
        balSpan = ce('span');
        balSpan.textContent = this.model.currency.formatCurrency(
            tr.src_result,
            tr.src_curr
        );
        transBalanceItem.appendChild(balSpan);
    }

    if (tr.type === INCOME
        || tr.type === TRANSFER
        || (tr.type === DEBT && tr.dest_id !== 0)
    ) {
        balSpan = ce('span');
        balSpan.textContent = this.model.currency.formatCurrency(
            tr.dest_result,
            tr.dest_curr
        );
        transBalanceItem.appendChild(balSpan);
    }
};

/**
 * Look for list item with specified identifier
 * @param {number} id - transaction identifier
 */
TransactionListView.prototype.findListItemById = function (id) {
    return this.listItems.querySelector('[data-id="' + id + '"]');
};

/**
 * Transaction block click event handler
 * @param {Event} e - click event object
 */
TransactionListView.prototype.onTransClick = function (e) {
    var listItemElem;
    var transactionId;
    var transaction;
    var selArr;

    listItemElem = this.findListItemElement(e.target);
    if (!listItemElem || !listItemElem.dataset) {
        return;
    }

    transactionId = parseInt(listItemElem.dataset.id, 10);
    transaction = this.getTransaction(transactionId);
    if (!transaction) {
        return;
    }

    if (this.model.selection.isSelected(transactionId)) {
        this.model.selection.deselect(transactionId);
        listItemElem.classList.remove('trans-list__item_selected');
    } else {
        this.model.selection.select(transactionId);
        listItemElem.classList.add('trans-list__item_selected');
    }

    this.toolbar.updateBtn.show(this.model.selection.count() === 1);
    this.toolbar.deleteBtn.show(this.model.selection.count() > 0);

    selArr = this.model.selection.getIdArray();
    this.delTransInp.value = selArr.join();

    if (this.model.selection.count() === 1) {
        this.toolbar.updateBtn.setURL(baseURL + 'transactions/edit/' + selArr[0]);
    }

    this.toolbar.show(this.model.selection.count() > 0);
};

/**
 * Sent AJAX request to server to change position of transaction
 * @param {number} transactionId - identifier of transaction to change position
 * @param {number} newPos  - new position of transaction
 */
TransactionListView.prototype.sendChangePosRequest = function (transactionId, newPos) {
    ajax.post({
        url: baseURL + 'api/transaction/setpos',
        data: JSON.stringify({
            id: transactionId,
            pos: newPos
        }),
        headers: { 'Content-Type': 'application/json' },
        callback: this.onChangePosCallback(transactionId, newPos)
    });
};

/**
 * Return callback function for position change request
 * @param {number} transactionId - identifier of transaction to change position
 * @param {number} newPos - new position of transaction
 */
TransactionListView.prototype.onChangePosCallback = function (transactionId, newPos) {
    return function (response) {
        var res = JSON.parse(response);
        if (res && res.result === 'ok') {
            this.updateTransArrPos(transactionId, newPos);
        } else {
            this.cancelPosChange(transactionId);
        }
    }.bind(this);
};

/**
 * Update local transactions array on successfull result from server
 * @param {number} transactionId - identifier of transaction to change position
 * @param {number} newPos - new position of transaction
 */
TransactionListView.prototype.updateTransArrPos = function (transactionId, newPos) {
    this.setPosition(transactionId, newPos);
};

/**
 * Cancel local changes on transaction position update fail
 * @param {number} trans_id - identifier of transaction
 */
TransactionListView.prototype.cancelPosChange = function (transactionId) {
    var origTr;
    var origWrap;
    var trBefore;
    var trBeforeWrap;

    if (!this.trListSortable || this.trListSortable.dragFrom === -1) {
        return;
    }

    origTr = this.findListItemById(transactionId);
    if (!origTr || !origTr.parentNode) {
        return;
    }

    origWrap = origTr.parentNode;
    if (this.trListSortable.dragFrom === 0) {
        prependChild(origWrap.parentNode, origWrap);
    } else {
        trBefore = this.findListItemById(this.trListSortable.dragFrom);
        if (!trBefore || !trBefore.parentNode) {
            return;
        }

        trBeforeWrap = trBefore.parentNode;
        insertAfter(origWrap, trBeforeWrap);
    }

    createMessage('Fail to change position of transaction.', 'msg_error');
};

/**
 * Find closest list item element to specified
 * @param {Element} elem - element to start looking from
 */
TransactionListView.prototype.findListItemElement = function (elem) {
    var res;
    var selector = (this.props.filterObj.mode === 'details') ? 'tr' : '.trans-list__item';

    if (!elem) {
        return null;
    }

    res = elem.querySelector(selector);
    if (!res) {
        return elem.closest(selector);
    }

    return res;
};

/**
 * Return transaction id from transaction item element
 * @param {Element} elem - target list item element
 */
TransactionListView.prototype.transIdFromElem = function (elem) {
    var listItemElem = this.findListItemElement(elem);
    if (!listItemElem || !listItemElem.dataset) {
        return 0;
    }

    return parseInt(listItemElem.dataset.id, 10);
};

/**
 * Transaction drag start event handler
 * @param {Element} elem - transaction list item element
 */
TransactionListView.prototype.onTransDragStart = function (elem) {
    var prevElem;

    if (!this.trListSortable || !elem) {
        return;
    }

    prevElem = elem.previousElementSibling;
    this.trListSortable.dragFrom = this.transIdFromElem(prevElem);
};

/**
 * Transaction item drop callback
 * @param {number} trans_id - identifier of moving transaction
 * @param {number} retrans_id - identifier of replaced transaction
 */
TransactionListView.prototype.onTransPosChanged = function (elem, refElem) {
    var transactionId;
    var refId;
    var replacedItem;

    transactionId = this.transIdFromElem(elem);
    refId = this.transIdFromElem(refElem);
    if (!transactionId || !refId) {
        return;
    }

    replacedItem = this.getTransaction(refId);
    if (replacedItem) {
        this.sendChangePosRequest(transactionId, replacedItem.pos);
    }
};

/**
 * Build new location address from current filterObj
 */
TransactionListView.prototype.buildAddress = function () {
    var newLocation = baseURL + 'transactions/';
    var locFilter = {};

    setParam(locFilter, this.props.filterObj);

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
        newLocation += '?' + urlJoin(locFilter);
    }

    return newLocation;
};

/**
 * Transaction type checkbox click event handler
 * @param {Event} e - click event object
 */
TransactionListView.prototype.onToggleTransType = function (e) {
    var itemElem;
    var selectedType;
    var ind;

    itemElem = e.target.closest('.trtype-menu__item');
    if (!itemElem || !itemElem.dataset) {
        return;
    }

    selectedType = parseInt(itemElem.dataset.type, 10);

    if (!('type' in this.props.filterObj)) {
        this.props.filterObj.type = [];
    }
    if (!Array.isArray(this.props.filterObj.type)) {
        this.props.filterObj.type = [this.props.filterObj.type];
    }

    ind = this.props.filterObj.type.indexOf(selectedType);
    if (ind === -1) {
        this.props.filterObj.type.push(selectedType);
    } else {
        this.props.filterObj.type.splice(ind, 1);
    }

    window.location = this.buildAddress();
};

/**
 * Account change event handler
 * @param {object} obj - selection object
 */
TransactionListView.prototype.onAccountChange = function (obj) {
    // Check all accounts from the new selection present in current selection
    var data = Array.isArray(obj) ? obj : [obj];
    var reloadNeeded = data.some(function (item) {
        var id = parseInt(item.id, 10);

        return (!this.props.filterObj.acc_id
                || !this.props.filterObj.acc_id.includes(id));
    }, this);

    // Check all currenlty selected accounts present in the new selection
    if (!reloadNeeded) {
        reloadNeeded = this.props.filterObj.acc_id.some(function (accountId) {
            return !data.find(function (item) {
                return item.id === accountId;
            });
        });
    }

    if (!reloadNeeded) {
        return;
    }

    // Prepare parameters
    this.props.filterObj.acc_id = data.map(function (item) {
        return parseInt(item.id, 10);
    });

    // Clear page number because list of transactions guaranteed to change on change accounts filter
    if ('page' in this.props.filterObj) {
        delete this.props.filterObj.page;
    }

    window.location = this.buildAddress();
};

/**
 * Transaction search form submit event handler
 * @param {Event} e - submit event
 */
TransactionListView.prototype.onSearchSubmit = function (e) {
    e.preventDefault();

    if (!this.searchInp) {
        return;
    }

    if (this.searchInp.value.length) {
        this.props.filterObj.search = this.searchInp.value;
    } else if ('search' in this.props.filterObj) {
        delete this.props.filterObj.search;
    }

    // Clear page number because list of transactions guaranteed to change on change search query
    if ('page' in this.props.filterObj) {
        delete this.props.filterObj.page;
    }

    window.location = this.buildAddress();
};

/**
 * Create and show transaction delete warning popup
 */
TransactionListView.prototype.confirmDelete = function () {
    var multi = (this.model.selection.count() > 1);

    if (this.model.selection.count() === 0) {
        return;
    }

    ConfirmDialog.create({
        id: 'delete_warning',
        title: (multi) ? multiTransDeleteTitle : singleTransDeleteTitle,
        content: (multi) ? multiTransDeleteMsg : singleTransDeleteMsg,
        onconfirm: this.delForm.submit.bind(this.delForm)
    });
};

/**
 * Date range select calback
 * @param {object} range - selected range object
 */
TransactionListView.prototype.onRangeSelect = function (range) {
    if (!range || !isDate(range.start) || !isDate(range.end)) {
        return;
    }

    this.model.selDateRange = range;
    this.datePicker.hide();
    this.dateInput.value = DatePicker.format(range.start) + ' - ' + DatePicker.format(range.end);
};

/**
 * Date picker hide callback
 */
TransactionListView.prototype.onDatePickerHide = function () {
    var newStartDate;
    var newEndDate;

    if (!this.model.selDateRange) {
        return;
    }

    newStartDate = DatePicker.format(this.model.selDateRange.start);
    newEndDate = DatePicker.format(this.model.selDateRange.end);

    if (this.props.filterObj.stdate === newStartDate
        && this.props.filterObj.enddate === newEndDate) {
        return;
    }

    this.props.filterObj.stdate = newStartDate;
    this.props.filterObj.enddate = newEndDate;

    // Clear page number because list of transactions guaranteed to change on change date range
    if ('page' in this.props.filterObj) {
        delete this.props.filterObj.page;
    }

    window.location = this.buildAddress();
};

/**
 * Show calendar block
 */
TransactionListView.prototype.showCalendar = function () {
    if (!this.datePicker) {
        this.datePicker = DatePicker.create({
            wrapper: this.datePickerWrapper,
            relparent: this.datePickerWrapper.parentNode,
            range: true,
            onrangeselect: this.onRangeSelect.bind(this),
            onhide: this.onDatePickerHide.bind(this)
        });
    }
    if (!this.datePicker) {
        return;
    }

    this.datePicker.show(!this.datePicker.visible());

    this.datePickerBtn.hide();
    show(this.dateBlock, true);

    setEmptyClick(this.datePicker.hide.bind(this.datePicker), [
        this.datePickerWrapper,
        this.datePickerBtn.elem,
        this.dateInputBtn
    ]);
};
