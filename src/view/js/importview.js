'use strict';

/* global ge, ce, re, isDate, isFunction, removeChilds, show, enable, extend, selectedValue */
/* global fixFloat, selectByValue, insertAfter, urlJoin, ajax */
/* global EXPENSE, INCOME, TRANSFER, DEBT, createMessage, baseURL, convertHint */
/* global AccountList, CurrencyList, PersonList, View, Sortable */
/* eslint no-bitwise: "off" */

/**
 * Import view constructor
 */
function ImportView() {
    ImportView.parent.constructor.apply(this, arguments);

    this.model = {
        importedRows: [],
        transactionRows: [],
        mainAccount: null,
        transCache: null
    };

    this.model.accounts = AccountList.create(this.props.accounts);
    this.model.currency = CurrencyList.create(this.props.currencies);
    this.model.persons = PersonList.create(this.props.persons);
}

extend(ImportView, View);

/**
 * View initialization
 */
ImportView.prototype.onStart = function () {
    this.newRowBtn = ge('newRowBtn');
    this.newPhBtn = ge('newPhBtn');
    this.submitBtn = ge('submitbtn');
    this.fileimportfrm = ge('fileimportfrm');
    this.importAllBtn = ge('importAllBtn');
    this.transCountElem = ge('trcount');
    this.notPickedCountElem = ge('notpickedcount');
    this.acc_id = ge('acc_id');
    this.fileUploadRadio = ge('fileUploadRadio');
    this.templateSel = ge('templateSel');
    this.serverPathInput = ge('srvFilePath');
    this.fileInput = ge('fileInp');
    this.isEncodeCheck = ge('isEncodeCheck');
    if (!this.newRowBtn
        || !this.newPhBtn
        || !this.submitBtn
        || !this.fileimportfrm
        || !this.importAllBtn
        || !this.transCountElem
        || !this.acc_id
        || !this.notPickedCountElem
        || !this.fileUploadRadio
        || !this.templateSel
        || !this.serverPathInput
        || !this.fileInput
        || !this.isEncodeCheck
    ) {
        throw new Error('Failed to initialize Import view');
    }

    this.newRowBtn.addEventListener('click', this.createRow.bind(this));
    this.newPhBtn.addEventListener('click', this.addPlaceholder.bind(this, null));
    this.acc_id.addEventListener('change', this.onMainAccChange.bind(this));
    this.importAllBtn.addEventListener('click', this.onImportAll.bind(this));
    this.submitBtn.addEventListener('click', this.onSubmitClick.bind(this));

    this.rowsContainer = ge('rowsContainer');
    this.importRows = ge('importRows');

    this.createRow();

    this.trListSortable = new Sortable({
        oninsertat: this.onTransPosChanged.bind(this),
        container: 'rowsContainer',
        group: 'transactions',
        selector: '.tr-row',
        placeholderClass: 'tr-row__placeholder',
        copyWidth: true,
        onlyRootHandle: true
    });

    this.fileimportfrm.addEventListener('submit', this.onFileImport.bind(this));
};

/**
 * Return account object by value of specified select element
 * @param {Element} selectObj - account select element to obtain value from
 */
ImportView.prototype.accFromSelect = function (selectObj) {
    var accountId = parseInt(selectedValue(selectObj), 10);
    return this.model.accounts.getItem(accountId);
};

/**
 * Return currency object by value of specified select element
 * @param {Element} selectObj - currency select element to obtain value from
 */
ImportView.prototype.currFromSelect = function (selectObj) {
    var currencyId = parseInt(selectedValue(selectObj), 10);
    return this.model.currency.getItem(currencyId);
};

/**
 * Refresh main account at model according to current selection
 */
ImportView.prototype.updMainAccObj = function () {
    this.model.mainAccount = this.accFromSelect(this.acc_id);
};

/**
 * Set positions of rows as they follows
 */
ImportView.prototype.updateRowsPos = function () {
    var updatedRows = this.model.transactionRows.map(function (item, ind) {
        var res = item;
        res.pos = ind;
        return res;
    });

    this.model.transactionRows = updatedRows;
};

/**
 * Remove all transaction rows
 */
ImportView.prototype.cleanTrRows = function () {
    this.model.transactionRows = [];
    removeChilds(this.rowsContainer);
    this.transCountElem.textContent = this.model.transactionRows.length;
};

/**
 * Remove all imported rows
 */
ImportView.prototype.cleanImpRows = function () {
    this.model.importedRows = [];
    removeChilds(this.importRows);
};

/**
 * Try to find row by element
 * @param {Element} elem
 */
ImportView.prototype.findRowByElement = function (elem) {
    if (!elem) {
        return null;
    }

    return this.model.transactionRows.find(function (rowObj) {
        return rowObj && rowObj.rowEl === elem;
    });
};

/**
 *
 * @param {Object|Event} e - row object or Event object
 */
ImportView.prototype.delRow = function (e) {
    var delPos;
    var rowObj;

    rowObj = (e instanceof Event) ? this.getRowFromEvent(e) : e;
    if (!rowObj) {
        return;
    }

    if (this.model.importedRows.length) {
        this.addPlaceholder(rowObj.rowEl);
    }
    re(rowObj.rowEl);

    delPos = rowObj.pos;
    this.model.transactionRows.splice(delPos, 1);
    this.updateRowsPos();

    this.transCountElem.textContent = this.model.transactionRows.length;
};

/**
 * Search for row by target element of specified event
 * @param {Event} e - event object
 */
ImportView.prototype.getRowFromEvent = function (e) {
    var rowEl;

    if (!e || !e.target) {
        return null;
    }

    rowEl = e.target.closest('.tr-row');
    return this.findRowByElement(rowEl);
};

/**
 * Row checkbox 'change' event handler. Enable/disable related row
 * @param {Event} e - event object
 */
ImportView.prototype.onRowChecked = function (e) {
    var rowObj = this.getRowFromEvent(e);
    if (!rowObj) {
        return;
    }

    this.enableRow(rowObj, rowObj.enableCheck.checked);
};

/**
 *
 * @param {*} rowObj
 * @param {*} val
 */
ImportView.prototype.enableRow = function (rowObj, val) {
    var newState;
    var checkbox;

    if (!rowObj) {
        return;
    }

    newState = (typeof val === 'undefined') ? true : !!val;
    if (newState) {
        rowObj.rowEl.classList.remove('tr-row_disabled');
    } else {
        rowObj.rowEl.classList.add('tr-row_disabled');
    }

    checkbox = rowObj.enableCheck;
    checkbox.checked = newState;
    enable(rowObj.trTypeSel, newState);
    enable(rowObj.amountInp, newState);
    enable(rowObj.currIdInp, newState);
    enable(rowObj.currSel, newState);
    enable(rowObj.destAccIdInp, newState);
    enable(rowObj.destAccSel, newState);
    enable(rowObj.personIdInp, newState);
    enable(rowObj.personSel, newState);
    enable(rowObj.destAmountInp, newState);
    enable(rowObj.dateInp, newState);
    enable(rowObj.commInp, newState);

    if (newState) {
        this.onTrTypeChanged(rowObj);
    }
};

/**
 * Create new row object
 */
ImportView.prototype.createRowObject = function () {
    var rowObj = {};

    // Row enable checkbox
    rowObj.enableCheck = ce('input', { type: 'checkbox', checked: true });
    rowObj.enableCheck.addEventListener('change', this.onRowChecked.bind(this));

    // Currency controls
    rowObj.currIdInp = ce('input', { type: 'hidden', name: 'curr_id[]', value: this.model.mainAccount.curr_id });
    rowObj.currSel = ce('select');
    this.model.currency.data.forEach(function (currency) {
        var option = ce('option', {
            value: currency.id,
            textContent: currency.name,
            selected: (currency.id === this.model.mainAccount.curr_id)
        });

        rowObj.currSel.appendChild(option);
    }, this);
    rowObj.currSel.addEventListener('change', this.onCurrChanged.bind(this));

    // Transaction type select
    rowObj.trTypeSel = ce('select',
        { name: 'tr_type[]' },
        [
            ce('option', { value: 'expense', textContent: '-' }),
            ce('option', { value: 'income', textContent: '+' }),
            ce('option', { value: 'transferfrom', textContent: 'T>' }),
            ce('option', { value: 'transferto', textContent: 'T<' }),
            ce('option', { value: 'debtfrom', textContent: 'D>' }),
            ce('option', { value: 'debtto', textContent: 'D<' })
        ]);
    rowObj.trTypeSel.addEventListener('change', this.onTrTypeChanged.bind(this));

    // Destination account controls
    rowObj.destAccIdInp = ce('input', { type: 'hidden', name: 'dest_acc_id[]', value: '' });
    rowObj.destAccSel = ce('select',
        { disabled: true },
        ce('option',
            {
                value: 0,
                textContent: 'Destination account',
                selected: true,
                disabled: true
            }));
    this.model.accounts.data.forEach(function (account) {
        var option = ce('option', { value: account.id, textContent: account.name });
        if (account.id === this.model.mainAccount.id) {
            enable(option, false);
        }

        rowObj.destAccSel.appendChild(option);
    }, this);
    rowObj.destAccSel.addEventListener('change', this.onDestChanged.bind(this));

    // Person controls
    rowObj.personIdInp = ce('input', { type: 'hidden', name: 'person_id[]', value: '' });
    rowObj.personSel = ce('select');
    this.model.persons.data.forEach(function (person) {
        var option = ce('option', { value: person.id, textContent: person.name });
        rowObj.personSel.appendChild(option);
    });
    show(rowObj.personSel, false);
    rowObj.personSel.addEventListener('change', this.onPersonChanged.bind(this));

    // Amount controls
    rowObj.amountInp = ce('input', { type: 'text', name: 'amount[]', placeholder: 'Amount' });
    rowObj.destAmountInp = ce('input', {
        type: 'text',
        name: 'dest_amount[]',
        disabled: true,
        placeholder: 'Destination amount'
    });

    rowObj.dateInp = ce('input', { type: 'text', name: 'date[]', placeholder: 'Date' });
    rowObj.commInp = ce('input', { type: 'text', name: 'comment[]', placeholder: 'Comment' });
    rowObj.delBtn = ce('input', { className: 'btn submit-btn', type: 'button', value: '-' });
    rowObj.delBtn.addEventListener('click', this.delRow.bind(this));

    rowObj.rowEl = ce('div',
        { className: 'tr-row' },
        [
            rowObj.enableCheck,
            rowObj.trTypeSel,
            rowObj.amountInp,
            rowObj.currIdInp,
            rowObj.currSel,
            rowObj.destAccIdInp,
            rowObj.destAccSel,
            rowObj.personIdInp,
            rowObj.personSel,
            rowObj.destAmountInp,
            rowObj.dateInp,
            rowObj.commInp,
            rowObj.delBtn
        ]);

    return rowObj;
};

/**
 * Find first sibling of item with specified class
 * @param {Element} elem - element to start looking from
 * @param {String} className - class name string
 */
ImportView.prototype.findFirstSiblingByClass = function (elem, className) {
    var item = elem;
    while (item) {
        item = item.nextElementSibling;
        if (item && item.classList.contains(className)) {
            return item;
        }
    }

    return null;
};

/**
 * Find last sigling of item with specified class
 * @param {Element} elem - element to start looking from
 * @param {String} className - class name string
 */
ImportView.prototype.findLastSiblingByClass = function (elem, className) {
    var item = elem;
    while (item) {
        item = item.previousElementSibling;
        if (item && item.classList.contains(className)) {
            return item;
        }
    }

    return null;
};

/**
 * Find first placeholder in the list
 * @param {Element} elem - element to start looking from
 * @param {String} className - class name string
 */
ImportView.prototype.findPlaceholder = function () {
    var item = this.rowsContainer.firstElementChild;
    if (!item) {
        return null;
    }

    if (item.classList.contains('tr-row__placeholder')) {
        return item;
    }

    return this.findFirstSiblingByClass(item, 'tr-row__placeholder');
};

/** Find first transaction item after specified */
ImportView.prototype.findNextItem = function (item) {
    return this.findFirstSiblingByClass(item, 'tr-row');
};

/** Find first transaction item before specified */
ImportView.prototype.findPrevItem = function (item) {
    return this.findLastSiblingByClass(item, 'tr-row');
};

/** Return nth child of element if exist */
ImportView.prototype.findNthItem = function (parent, n) {
    var item;
    var i;

    if (!parent || !n) {
        return null;
    }

    item = parent.firstElementChild;
    for (i = 1; i < n; i += 1) {
        item = item.nextElementSibling;
        if (!item) {
            return null;
        }
    }

    return item;
};

/** Add new transaction row and insert it into list */
ImportView.prototype.createRow = function () {
    var rowObj;
    var firstPlaceholder;
    var nextTrRow;
    var nextTrRowObj;

    this.updMainAccObj();
    if (!this.model.mainAccount) {
        return;
    }

    rowObj = this.createRowObject();
    this.enableRow(rowObj, true);

    firstPlaceholder = this.findPlaceholder();
    if (firstPlaceholder) {
        nextTrRow = this.findNextItem(firstPlaceholder);

        insertAfter(rowObj.rowEl, firstPlaceholder);
        if (nextTrRow) {
            nextTrRowObj = this.getRowByElem(nextTrRow);
            this.model.transactionRows.splice(nextTrRowObj.pos, 0, rowObj);
            this.updateRowsPos();
        } else {
            rowObj.pos = this.model.transactionRows.length;
            this.model.transactionRows.push(rowObj);
        }

        re(firstPlaceholder);
    } else {
        this.rowsContainer.appendChild(rowObj.rowEl);

        rowObj.pos = this.model.transactionRows.length;

        this.model.transactionRows.push(rowObj);
    }

    this.transCountElem.textContent = this.model.transactionRows.length;
};

/** Disable account option if it's the same as main account */
ImportView.prototype.syncAccountOption = function (opt) {
    var optVal;
    var res = opt;

    if (!res) {
        return;
    }

    optVal = parseInt(res.value, 10);
    if (optVal === 0 || optVal === this.model.mainAccount.id) {
        res.disabled = true;
        res.selected = false;
    } else {
        res.disabled = false;
    }
};

ImportView.prototype.syncDestAccountSelect = function (rowObj) {
    var i;
    var l;

    for (i = 0, l = rowObj.destAccSel.options.length; i < l; i += 1) {
        this.syncAccountOption(rowObj.destAccSel.options[i]);
    }
};

ImportView.prototype.syncDestAmountAvail = function (rowObj) {
    var trType;
    var currObj;
    var destAccObj;
    var isDiff;

    trType = selectedValue(rowObj.trTypeSel);
    if (trType === 'expense' || trType === 'income') {
        currObj = this.currFromSelect(rowObj.currSel);
        isDiff = (currObj !== null && this.model.mainAccount.curr_id !== currObj.id);
        enable(rowObj.destAmountInp, isDiff);
    } else if (trType === 'transferfrom' || trType === 'transferto') {
        destAccObj = this.accFromSelect(rowObj.destAccSel);
        isDiff = (destAccObj !== null && this.model.mainAccount.curr_id !== destAccObj.curr_id);
        enable(rowObj.destAmountInp, isDiff);
    } else {
        /** Debt */
        enable(rowObj.destAmountInp, false);
    }
};

/** Copy destination account id from select to hidden input */
ImportView.prototype.copyDestAcc = function (rowObj) {
    var destAccountInput;

    if (!rowObj || !rowObj.destAccIdInp || !rowObj.destAccSel) {
        return;
    }

    destAccountInput = rowObj.destAccIdInp;
    destAccountInput.value = selectedValue(rowObj.destAccSel);
};

/** Transaction type select 'change' event handler */
ImportView.prototype.onTrTypeChanged = function (e) {
    var rowObj;
    var trType;

    rowObj = (e instanceof Event) ? this.getRowFromEvent(e) : e;
    if (!rowObj) {
        return;
    }

    trType = selectedValue(rowObj.trTypeSel);
    if (!rowObj.destAccSel || !rowObj.destAccSel.options) {
        return;
    }

    this.syncCurrAvail(rowObj);
    if (trType === 'transferfrom' || trType === 'transferto') {
        show(rowObj.personSel, false);
        show(rowObj.destAccSel, true);
        enable(rowObj.destAccSel, true);
        this.syncDestAccountSelect(rowObj);
        this.copyDestAcc(rowObj);
    } else if (trType === 'debtfrom' || trType === 'debtto') {
        this.copyPerson(rowObj);
        show(rowObj.personSel, true);
        show(rowObj.destAccSel, false);
        enable(rowObj.destAccSel, false);
    } else {
        show(rowObj.personSel, false);
        show(rowObj.destAccSel, true);
        enable(rowObj.destAccSel, false);
    }

    this.syncDestAmountAvail(rowObj);
};

/**
 * Enable/disable currency select according to transaction type
 * @param {Object} rowObj - row object
 */
ImportView.prototype.syncCurrAvail = function (rowObj) {
    var trType = selectedValue(rowObj.trTypeSel);

    /**
     * transfer expect currencies will be the same as source and destination account
     * debt curently expect only the same currency as account
     */
    if (
        trType === 'transferfrom'
        || trType === 'transferto'
        || trType === 'debtfrom'
        || trType === 'debtto'
    ) {
        enable(rowObj.currSel, false);
        selectByValue(rowObj.currSel, this.model.mainAccount.curr_id);
        this.copyCurr(rowObj);
    } else {
        enable(rowObj.currSel, true);
    }
};

ImportView.prototype.copyCurr = function (rowObj) {
    var currencyInput;

    if (!rowObj || !rowObj.currIdInp || !rowObj.currSel) {
        return;
    }

    currencyInput = rowObj.currIdInp;
    currencyInput.value = selectedValue(rowObj.currSel);
};

ImportView.prototype.onCurrChanged = function (e) {
    var rowObj = (e instanceof Event) ? this.getRowFromEvent(e) : e;
    if (!rowObj) {
        return;
    }

    this.copyCurr(rowObj);
    this.syncDestAmountAvail(rowObj);
};

/**
 * Main account select event handler
 */
ImportView.prototype.onMainAccChange = function () {
    this.updMainAccObj();
    if (!this.model.mainAccount) {
        return;
    }

    this.model.transactionRows.forEach(function (rowObj) {
        var trType = selectedValue(rowObj.trTypeSel);
        if (trType === 'transferfrom' || trType === 'transferto') {
            this.syncDestAccountSelect(rowObj);
            this.copyDestAcc(rowObj);
        }
        this.syncCurrAvail(rowObj);
        this.syncDestAmountAvail(rowObj);
    }, this);
};

/**
 * Destination account select 'change' event handler
 * @param {Event} e - event object
 */
ImportView.prototype.onDestChanged = function (e) {
    var rowObj = (e instanceof Event) ? this.getRowFromEvent(e) : e;
    if (!rowObj) {
        return;
    }

    this.copyDestAcc(rowObj);
    this.syncDestAmountAvail(rowObj);
};

/**
 * Copy person id value from select to hidden input
 * @param {Object} rowObj - row object
 */
ImportView.prototype.copyPerson = function (rowObj) {
    var personInput;

    if (!rowObj || !rowObj.personIdInp || !rowObj.personSel) {
        return;
    }

    personInput = rowObj.personIdInp;
    personInput.value = selectedValue(rowObj.personSel);
};

/**
 * Person select 'change' event handler
 * @param {Event} e - event object
 */
ImportView.prototype.onPersonChanged = function (e) {
    var rowObj = (e instanceof Event) ? this.getRowFromEvent(e) : e;
    if (!rowObj) {
        return;
    }

    this.copyPerson(rowObj);
};

ImportView.prototype.onSubmitClick = function () {
    var reqObj;

    if (!Array.isArray(this.model.transactionRows)) {
        return;
    }

    reqObj = this.model.transactionRows.filter(function (rowObj) {
        return rowObj && rowObj.rowEl && !rowObj.rowEl.classList.contains('tr-row_disabled');
    }).map(function (rowObj) {
        var trObj = {};
        var selType = selectedValue(rowObj.trTypeSel);
        var secondAcc = this.model.accounts.getItem(parseInt(rowObj.destAccIdInp.value, 10));
        var person = this.model.persons.getItem(parseInt(rowObj.personIdInp.value, 10));
        var amountVal = fixFloat(rowObj.amountInp.value);
        var secondAmountVal = fixFloat(rowObj.destAmountInp.value);
        var selectedCurr = parseInt(rowObj.currIdInp.value, 10);

        if (selType === 'expense') {
            trObj.type = EXPENSE;
            trObj.src_id = this.model.mainAccount.id;
            trObj.dest_id = 0;
            trObj.src_curr = this.model.mainAccount.curr_id;
            trObj.dest_curr = selectedCurr;
            trObj.src_amount = amountVal;
            trObj.dest_amount = (trObj.src_curr === trObj.dest_curr) ? amountVal : secondAmountVal;
        } else if (selType === 'income') {
            trObj.type = INCOME;
            trObj.src_id = 0;
            trObj.dest_id = this.model.mainAccount.id;
            trObj.src_curr = selectedCurr;
            trObj.dest_curr = this.model.mainAccount.curr_id;
            trObj.src_amount = (trObj.src_curr === trObj.dest_curr) ? amountVal : secondAmountVal;
            trObj.dest_amount = amountVal;
        } else if (selType === 'transferfrom') {
            if (!secondAcc) {
                throw new Error('Invalid transaction: Second account not set');
            }

            trObj.type = TRANSFER;
            trObj.src_id = this.model.mainAccount.id;
            trObj.dest_id = secondAcc.id;
            trObj.src_curr = this.model.mainAccount.curr_id;
            trObj.dest_curr = secondAcc.curr_id;
            trObj.src_amount = amountVal;
            trObj.dest_amount = (trObj.src_curr === trObj.dest_curr) ? amountVal : secondAmountVal;
        } else if (selType === 'transferto') {
            if (!secondAcc) {
                throw new Error('Invalid transaction: Second account not set');
            }

            trObj.type = TRANSFER;
            trObj.src_id = secondAcc.id;
            trObj.dest_id = this.model.mainAccount.id;
            trObj.src_curr = secondAcc.curr_id;
            trObj.dest_curr = this.model.mainAccount.curr_id;
            trObj.src_amount = (trObj.src_curr === trObj.dest_curr) ? amountVal : secondAmountVal;
            trObj.dest_amount = amountVal;
        } else if (selType === 'debtfrom' || selType === 'debtto') {
            if (!person) {
                throw new Error('Invalid transaction: Person not set');
            }

            trObj.type = DEBT;
            trObj.op = (selType === 'debtfrom') ? 1 : 2;
            trObj.person_id = person.id;
            trObj.acc_id = this.model.mainAccount.id;
            trObj.src_curr = this.model.mainAccount.curr_id;
            trObj.dest_curr = this.model.mainAccount.curr_id;
            trObj.src_amount = amountVal;
            trObj.dest_amount = amountVal;
        }

        trObj.date = rowObj.dateInp.value;
        trObj.comment = rowObj.commInp.value;

        return trObj;
    }, this);

    ajax.post({
        url: baseURL + 'api/transaction/createMultiple/',
        data: JSON.stringify(reqObj),
        headers: { 'Content-Type': 'application/json' },
        callback: this.onCommitResult.bind(this)
    });
};

/**
 * Submit response handler
 * @param {String} response - response text
 */
ImportView.prototype.onCommitResult = function (response) {
    var respObj;
    var status = false;
    var message = 'Fail to import transactions';

    try {
        respObj = JSON.parse(response);
        status = (respObj && respObj.result === 'ok');
        if (status) {
            message = 'All transactions have been successfully imported';
            this.cleanTrRows();
            this.cleanImpRows();
            show('importpickstats', false);
        } else if (respObj && respObj.msg) {
            message = respObj.msg;
        }
    } catch (e) {
        message = e.message;
    }

    createMessage(message, (status ? 'msg_success' : 'msg_error'));
};

/**
 * Search row object by specified element
 * @param {Element} rowEl - row root element
 */
ImportView.prototype.getRowByElem = function (rowEl) {
    return this.model.transactionRows.find(function (rowObj) {
        return (rowEl === rowObj.rowEl);
    });
};

/**
 * Transaction reorder handler
 * @param {Object} origRow - original row object
 * @param {Object} replacedRow - new row object
 */
ImportView.prototype.onTransPosChanged = function (origRow, replacedRow) {
    var origRowObj;
    var prevItemObj;
    var nextItemObj;
    var replacedRowObj;
    var cutRow;

    if (this.model.transactionRows.length < 2) {
        return;
    }

    origRowObj = this.getRowByElem(origRow);
    if (!origRowObj || !replacedRow) {
        return;
    }

    /* Put transaction on placeholder */
    if (!replacedRow.classList.contains('tr-row')) {
        prevItemObj = this.getRowByElem(this.findPrevItem(origRow));
        nextItemObj = this.getRowByElem(this.findNextItem(origRow));

        if (!prevItemObj) {
            /* insert at the beginning of list */
            cutRow = this.model.transactionRows.splice(origRowObj.pos, 1)[0];
            this.model.transactionRows.splice(0, 0, cutRow);
        } else if (prevItemObj && prevItemObj.pos > origRowObj.pos) {
            cutRow = this.model.transactionRows.splice(origRowObj.pos, 1)[0];
            this.model.transactionRows.splice(prevItemObj.pos, 0, cutRow);
        } else if (nextItemObj && nextItemObj.pos < origRowObj.pos) {
            cutRow = this.model.transactionRows.splice(origRowObj.pos, 1)[0];
            this.model.transactionRows.splice(nextItemObj.pos, 0, cutRow);
        } else {
            /* nothing changed */
            return;
        }
    } else {
        replacedRowObj = this.getRowByElem(replacedRow);
        if (!replacedRowObj) {
            return;
        }
        cutRow = this.model.transactionRows.splice(origRowObj.pos, 1)[0];
        this.model.transactionRows.splice(replacedRowObj.pos, 0, cutRow);
    }

    this.updateRowsPos();
};

/**
 * Insert placeholder after specified element or append to the end of rows container
 * @param {undefined|Element} refItem - reference element, to insert placeholder after
 */
ImportView.prototype.addPlaceholder = function (refItem) {
    var phElem = ce('div', { className: 'tr-row__placeholder' });

    if (!refItem) {
        this.rowsContainer.appendChild(phElem);
    } else {
        insertAfter(phElem, refItem);
    }
};

// Return first found transaction with same date and amount as reference
ImportView.prototype.findSameTransaction = function (reference) {
    return this.model.transCache.find(function (item) {
        return (item.src_id === this.model.mainAccount.id
            || item.dest_id === this.model.mainAccount.id)
            && ((item.src_amount === Math.abs(reference.trAmountVal)
                && item.dest_amount === Math.abs(reference.accAmountVal))
                || (item.src_amount === Math.abs(reference.accAmountVal)
                    && item.dest_amount === Math.abs(reference.trAmountVal)))
            && item.date === reference.date
            && !item.picked;
    }, this);
};

/**
 *
 * @param {*} response
 */
ImportView.prototype.onTrCacheResult = function (response) {
    var jsondata;
    var notPicked;

    try {
        jsondata = JSON.parse(response);
    } catch (e) {
        return;
    }

    if (!jsondata || jsondata.result !== 'ok') {
        return;
    }

    this.model.transCache = jsondata.data;
    this.model.importedRows.forEach(function (row) {
        var data;
        var transaction = this.findSameTransaction(row.data);
        if (transaction) {
            transaction.picked = true;
            data = row.data;
            data.sameFound = true;
            this.mapImportRow(row);
        }
    }, this);

    notPicked = this.model.transCache.filter(function (item) {
        return !item.picked;
    });

    this.notPickedCountElem.textContent = notPicked.length
        + ' (' + notPicked.map(function (item) { return item.id; }).join() + ')';
    show('importpickstats', true);
};

/**
 * Convert date string to timestamp
 * @param {string} str - date string in DD.MM.YYYY format
 */
ImportView.prototype.timestampFromDateString = function (str) {
    var dparts;
    var res;

    if (typeof str !== 'string') {
        throw new Error('Invalid type of parameter');
    }

    dparts = str.split('.');
    res = new Date(dparts[2], dparts[1] - 1, dparts[0]);

    return res.getTime();
};

/**
 * Format date as DD.MM.YYYY
 * @param {Date} date - date to format
 */
ImportView.prototype.formatDate = function (date) {
    var month;
    var year;
    var day;

    if (!isDate(date)) {
        throw new Error('Invalid type of parameter');
    }

    month = date.getMonth();
    year = date.getFullYear();
    day = date.getDate();

    return ((day > 9) ? '' : '0') + day + '.' + ((month + 1 > 9) ? '' : '0') + (month + 1) + '.' + year;
};

/**
 * Import data request callback
 * @param {object} response - data for import request
 */
ImportView.prototype.importLoadCallback = function (response) {
    var data;
    var reqParams;
    var importedDateRange = { start: 0, end: 0 };

    if (!response || !this.importRows.parentNode) {
        return;
    }

    this.importRows.parentNode.classList.add('column');
    this.rowsContainer.classList.add('column');

    try {
        data = JSON.parse(response);
    } catch (e) {
        return;
    }
    if (!Array.isArray(data)) {
        return;
    }

    this.cleanTrRows();
    data.forEach(function (dataObj) {
        var timestamp;
        var impRowObj = {};

        // Store date region of imported transactions
        timestamp = this.timestampFromDateString(dataObj.date);

        if (importedDateRange.start === 0 || importedDateRange.start > timestamp) {
            importedDateRange.start = timestamp;
        }
        if (importedDateRange.end === 0 || importedDateRange.end < timestamp) {
            importedDateRange.end = timestamp;
        }

        impRowObj.data = dataObj;
        impRowObj.mapBtn = ce('input', { className: 'btn submit-btn', type: 'button', value: '->' });
        impRowObj.mapBtn.addEventListener('click', this.mapImportRow.bind(this, impRowObj));

        impRowObj.rowEl = ce('tr',
            { className: 'import-row' },
            [
                ce('td', { textContent: dataObj.date }),
                ce('td', { textContent: dataObj.trAmountVal }),
                ce('td', { textContent: dataObj.trCurrVal }),
                ce('td', { textContent: dataObj.accAmountVal }),
                ce('td', { textContent: dataObj.accCurrVal }),
                ce('td', {},
                    ce('div', { className: 'ellipsis-cell' },
                        ce('div', { title: dataObj.descr },
                            ce('span', { textContent: dataObj.descr })))),
                ce('td', {}, impRowObj.mapBtn)
            ]);

        this.importRows.appendChild(impRowObj.rowEl);
        impRowObj.pos = this.model.importedRows.length;
        this.model.importedRows.push(impRowObj);
        this.addPlaceholder();
    }, this);

    this.importAllBtn.disabled = false;

    reqParams = urlJoin({
        count: 0,
        stdate: this.formatDate(new Date(importedDateRange.start)),
        enddate: this.formatDate(new Date(importedDateRange.end)),
        acc_id: this.model.mainAccount.id
    });

    ajax.get({
        url: baseURL + 'api/transaction/list/?' + reqParams,
        callback: this.onTrCacheResult.bind(this)
    });
};

/**
 * Map import row to new transaction
 * @param {Object} impRowObj - import row object
 */
ImportView.prototype.mapImportRow = function (impRowObj) {
    var accCurr;
    var trCurr;
    var rowObj;
    var trType;
    var item;
    var replacedRow;
    var replacedRowObj;

    if (!impRowObj || !impRowObj.data) {
        return;
    }

    accCurr = this.model.currency.findByName(impRowObj.data.accCurrVal);
    if (!accCurr) {
        alert('Unknown currency ' + impRowObj.data.accCurrVal);
        return;
    }

    trCurr = this.model.currency.findByName(impRowObj.data.trCurrVal);
    if (!trCurr) {
        alert('Unknown currency ' + impRowObj.data.trCurrVal);
        return;
    }

    /** Currency should be same as main account */
    if (accCurr.id !== this.model.mainAccount.curr_id) {
        alert('Currency must be the same as main account');
        return;
    }

    rowObj = this.createRowObject();
    trType = (impRowObj.data.accAmountVal > 0) ? 'income' : 'expense';
    selectByValue(rowObj.trTypeSel, trType);
    this.onTrTypeChanged(rowObj);
    rowObj.amountInp.value = Math.abs(impRowObj.data.accAmountVal);

    if (trCurr.id !== accCurr.id) {
        selectByValue(rowObj.currSel, trCurr.id);
        this.onCurrChange(rowObj.currSel, rowObj);
        rowObj.destAmountInp.value = Math.abs(impRowObj.data.trAmountVal);
    }

    rowObj.dateInp.value = impRowObj.data.date;
    rowObj.commInp.value = impRowObj.data.descr;

    if (typeof window.convertHint !== 'undefined' && isFunction(window.convertHint)) {
        rowObj = convertHint.call(this, impRowObj.data, rowObj);
    }

    item = this.findNthItem(this.rowsContainer, impRowObj.pos + 1);
    if (!item) {
        return;
    }

    if (item.classList.contains('tr-row')) {
        /* insert at filled transaction */
        replacedRow = this.getRowByElem(item);
        this.model.transactionRows[replacedRow.pos] = rowObj;
    } else if (!this.model.transactionRows.length) {
        /* insert to empty list */
        this.model.transactionRows.push(rowObj);
    } else {
        /* insert at placeholder */
        replacedRow = this.findNextItem(item);
        if (replacedRow) {
            replacedRowObj = this.getRowByElem(replacedRow);
            if (!replacedRowObj) {
                return;
            }
            this.model.transactionRows.splice(replacedRowObj.pos - 1, 0, rowObj);
        } else {
            replacedRow = this.findPrevItem(item);
            replacedRowObj = this.getRowByElem(replacedRow);
            if (!replacedRowObj) {
                return;
            }
            this.model.transactionRows.splice(replacedRowObj.pos, 0, rowObj);
        }
    }

    this.enableRow(rowObj, !impRowObj.data.sameFound);
    insertAfter(rowObj.rowEl, item);
    re(item);

    this.transCountElem.textContent = this.model.transactionRows.length;
    this.updateRowsPos();
};

/** 'Import all' button 'click' event handler */
ImportView.prototype.onImportAll = function () {
    this.model.importedRows.forEach(this.mapImportRow.bind(this));
};

/**
 * Obtain 32-bit integer from string
 * @param {string} str - string to create hash from
 */
function hashCode(str) {
    var i;
    var chr;
    var hash = 0;

    if (str.length === 0) {
        return 0;
    }

    for (i = 0; i < str.length; i += 1) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; /* Convert to 32bit integer */
    }

    return Math.abs(hash);
}

function Uploader(file, options, onSuccess, onError, onProgress) {
    var fileId;
    var fileType;
    var errorCount = 0;
    var MAX_ERROR_COUNT = 6;
    var startByte = 0;
    var xhrUpload;
    var xhrStatus;

    /* fileId is unique file identificator */
    fileId = file.name + '-' + file.size + '-' + +file.lastModifiedDate;
    fileType = file.name.substr(file.name.lastIndexOf('.') + 1);

    /**
     * make integer from file id to send in header
     * only ASCII symbols is available in headers
     */
    fileId = hashCode(fileId);

    function send() {
        xhrUpload = new XMLHttpRequest();
        xhrUpload.onload = function () {
            if (this.status === 200) {
                if (isFunction(onSuccess)) {
                    onSuccess(this.response);
                }
            } else {
                /** Try again if failed */
                errorCount += 1;
                if (errorCount <= MAX_ERROR_COUNT) {
                    setTimeout(send, 1000 * errorCount);
                } else if (isFunction(onError)) {
                    onError(this.statusText);
                }
            }
        };
        xhrUpload.onerror = xhrUpload.onload;

        xhrUpload.open('POST', baseURL + 'fastcommit/upload', true);
        // which file upload
        xhrUpload.setRequestHeader('X-File-Id', fileId);
        xhrUpload.setRequestHeader('X-File-Type', fileType);
        xhrUpload.setRequestHeader('X-File-Tpl', options.template);
        if (options.encode) {
            xhrUpload.setRequestHeader('X-File-Encode', 1);
        }

        xhrUpload.upload.onprogress = function (e) {
            errorCount = 0;
            if (isFunction(onProgress)) {
                onProgress(startByte + e.loaded, startByte + e.total);
            }
        };

        // send from startByte
        xhrUpload.send(file.slice(startByte));
    }

    function upload() {
        xhrStatus = new XMLHttpRequest();

        xhrStatus.onload = function () {
            if (this.status === 200) {
                startByte = +this.responseText || 0;
                send();
            } else {
                /* on fail try again after 1 second */
                errorCount += 1;
                if (errorCount <= MAX_ERROR_COUNT) {
                    setTimeout(upload, 1000 * errorCount);
                } else if (isFunction(onError)) {
                    onError(this.statusText);
                }
            }
        };

        xhrStatus.onerror = xhrStatus.onload;

        xhrStatus.open('GET', baseURL + 'fastcommit/uploadstatus', true);
        xhrStatus.setRequestHeader('X-File-Id', fileId);
        xhrStatus.setRequestHeader('X-File-Type', fileType);
        xhrStatus.send();
    }

    function pause() {
        if (xhrStatus) {
            xhrStatus.abort();
        }
        if (xhrUpload) {
            xhrUpload.abort();
        }
    }

    this.upload = upload;
    this.pause = pause;
}

/**
 *
 * @param {*} response - text of response for import request
 */
ImportView.prototype.onImportSuccess = function (response) {
    this.importLoadCallback(response);
};

/**
 *
 */
ImportView.prototype.onImportError = function () {
    console.log('error');
};

/**
 * Import progress callback
 * @param {Number} loaded - bytes loaded
 * @param {Number} total - total bytes
 */
ImportView.prototype.onImportProgress = function () {
};

/**
 *
 * @param {*} e
 */
ImportView.prototype.onFileImport = function (e) {
    var file;
    var uploader;
    var reqObj;
    var templateId = this.templateSel.value;
    var isEncoded = this.isEncodeCheck.checked;

    e.preventDefault();

    if (this.fileUploadRadio.checked) {
        file = this.fileInput.files[0];
        if (!file) {
            return;
        }

        uploader = new Uploader(
            file,
            { template: templateId, encode: isEncoded },
            this.onImportSuccess.bind(this),
            this.onImportError.bind(this),
            this.onImportProgress.bind(this)
        );
        uploader.upload();
    } else {
        reqObj = {
            fileName: this.serverPathInput.value,
            template: templateId,
            encode: (isEncoded ? 1 : 0)
        };

        ajax.post({
            url: baseURL + 'fastcommit/upload/',
            data: urlJoin(reqObj),
            callback: this.onImportSuccess.bind(this)
        });
    }
};
