var singleTransDeleteTitle = 'Delete transaction';
var multiTransDeleteTitle = 'Delete transactions';
var multiTransDeleteMsg = 'Are you sure want to delete selected transactions?<br>Changes in the balance of affected accounts will be canceled.';
var singleTransDeleteMsg = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';


/**
 * List of transactions view
 */
function TransactionListView(props)
{
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
TransactionListView.prototype.onStart = function()
{
    this.typeMenu = document.querySelector('.trtype-menu');
    if (!this.typeMenu)
        throw new Error('Failed to initialize Transaction List view');
    this.typeMenu.addEventListener('click', this.onToggleTransType.bind(this));

    this.accountDropDown = DropDown.create({
        input_id : 'acc_id',
        placeholder : 'Select account',
        onchange : this.onAccountChange.bind(this),
        editable : false,
        extraClass : 'dd__fullwidth'
    });
    if (!this.accountDropDown)
        throw new Error('Failed to initialize Transaction List view');

    this.searchFrm = ge('searchFrm');
    if (!this.searchFrm)
        throw new Error('Failed to initialize Transaction List view');
    this.searchFrm.addEventListener('submit', this.onSearchSubmit.bind(this));

    this.searchInp = ge('search');
    if (!this.searchInp)
        throw new Error('Failed to initialize Transaction List view');
    this.searchInp.inputMode = 'search';

    this.datePickerBtn = IconLink.fromElement({
        elem: 'calendar_btn',
        onclick: this.showCalendar.bind(this)
    });
    this.dateBlock = ge('date_block');
    this.datePickerWrapper = ge('calendar');

    this.dateInputBtn = ge('cal_rbtn');
    if (this.dateInputBtn)
        this.dateInputBtn.addEventListener('click', this.showCalendar.bind(this));
    this.dateInput = ge('date');

    this.delForm = ge('delform');
    this.delTransInp = ge('deltrans');
    if (!this.delForm || !this.delTransInp)
        throw new Error('Failed to initialize Transaction List view');

    this.trListSortable = null;
    this.listItems = ge('tritems');
    if (this.listItems)
    {
        this.trListSortable = new Sortable({
            ondragstart : this.onTransDragStart.bind(this),
            oninsertat : this.onTransPosChanged.bind(this),
            container : 'tritems',
            group : 'transactions',
            selector : '.trans-list__item-wrapper',
            placeholderClass : 'trans-list__item-placeholder',
            copyWidth : true,
            table : (filterObj.mode == 'details')
        });

        // dragFrom is transaction id before transaction started to drag
        // 0 if drag first transaction, -1 if no draggin currently
        this.trListSortable.dragFrom = -1;

        this.listItems.addEventListener('click', this.onTransClick.bind(this));
    }

    this.toolbar = Toolbar.create({
        elem: 'toolbar',
        ondelete: this.showDeletePopup.bind(this)
    });
};


/**
 * Search for transaction by specified id
 * @param {number} transaction_id - identifier of transaction
 */
TransactionListView.prototype.getTransaction = function(transaction_id)
{
    var res = transArr.find(function(item){ return item && item.id == transaction_id });

    return (res) ? res : null;
};


/**
 * Set position of transaction and update position and result balance of related transactions
 * @param {number} transaction_id - identifier of transaction
 * @param {number} pos - new position of specified transaction
 */
TransactionListView.prototype.setPosition = function(transaction_id, pos)
{
    function posCompare(tr1, tr2)
    {
        if (tr1.pos < tr2.pos)
            return -1;
        else if (tr1.pos > tr2.pos)
            return 1;

        return 0;
    }


    var tr_info = this.getTransaction(transaction_id);
    if (!tr_info)
        return false;

    var oldPos = tr_info.pos;
    if (oldPos == pos)
    {
        return true;
    }
    else
    {
        var initBalArr = [];

        transArr.sort(posCompare);

        transArr.forEach(function(trans)
        {
            if (trans.id == transaction_id)
            {
                trans.pos = pos;
            }
            else
            {
                if (oldPos == 0)			// insert with specified position
                {
                    if (trans.pos >= pos)
                        trans.pos += 1;
                }
                else if (pos < oldPos)		// moving up
                {
                    if (trans.pos >= pos && trans.pos < oldPos)
                        trans.pos += 1;
                }
                else if (pos > oldPos)		// moving down
                {
                    if (trans.pos > oldPos && trans.pos <= pos)
                        trans.pos -= 1;
                }
            }

            //if (trans.src_id && initBalArr[trans.src_id] === undefined)
            if (trans.src_id && !(trans.src_id in initBalArr))
            {
                initBalArr[trans.src_id] = trans.src_result + trans.src_amount;
            }

            //if (trans.dest_id && initBalArr[trans.dest_id] === undefined)
            if (trans.dest_id && !(trans.dest_id in initBalArr))
            {
                initBalArr[trans.dest_id] = trans.dest_result - trans.dest_amount;
            }
        });

        // Sort array of  transaction by position again
        transArr.sort(posCompare);

        if (filterObj.mode == 'details')
        {
            var tBalanceArr = [];

            transArr.forEach(function(trans)
            {
                src_bal = (trans.src_id != 0 && tBalanceArr[trans.src_id] !== undefined) ? tBalanceArr[trans.src_id] : initBalArr[trans.src_id];
                dest_bal = (trans.dest_id != 0 && tBalanceArr[trans.dest_id] !== undefined) ? tBalanceArr[trans.dest_id] : initBalArr[trans.dest_id];

                if (oldPos == 0)			// insert with specified position
                {
                    if (trans.pos >= pos)
                    {
                        this.updateBalance(trans, src_bal, dest_bal);
                    }
                }
                else if (pos < oldPos)		// moving up
                {
                    if (trans.pos >= pos && trans.pos <= oldPos)
                    {
                        this.updateBalance(trans, src_bal, dest_bal);
                    }
                }
                else if (pos > oldPos)		// moving down
                {
                    if (trans.pos >= oldPos && trans.pos <= pos)
                        this.updateBalance(trans, src_bal, dest_bal);
                }

                tBalanceArr[trans.src_id] = trans.src_result;
                tBalanceArr[trans.dest_id] = trans.dest_result;
            }, this);
        }
    }

    return true;
};


/**
 * 
 * @param {object} transaction - transaction object
 * @param {number} src_bal - source balance
 * @param {number} dest_bal - destination balance
 */
TransactionListView.prototype.updateBalance = function(transaction, src_bal, dest_bal)
{
    if (!transaction)
        return;

    if (transaction.src_id != 0)
    {
        if (src_bal === null)
            src_bal = transaction.src_result + transaction.src_amount;
        transaction.src_result = src_bal - transaction.src_amount;
    }
    else
    {
        transaction.src_result = 0;
    }

    if (transaction.dest_id != 0)
    {
        if (dest_bal === null)
            dest_bal = transaction.dest_result - transaction.dest_amount;
        transaction.dest_result = dest_bal + transaction.dest_amount;
    }
    else
    {
        transaction.dest_result = 0;
    }

    var transItemElem = this.findListItemById(transaction.id);
    if (!transItemElem)
        return;
    var transBalanceItem = transItemElem.querySelector('.tritem_balance');
    if (!transBalanceItem)
        return;

    removeChilds(transBalanceItem);

    var balSpan;
    if (transaction.type == EXPENSE || transaction.type == TRANSFER || (transaction.type == DEBT && transaction.src_id != 0))
    {
        balSpan = ce('span');
        balSpan.textContent = this.model.currency.formatCurrency(transaction.src_result, transaction.src_curr);
        transBalanceItem.appendChild(balSpan);
    }

    if (transaction.type == INCOME || transaction.type == TRANSFER || (transaction.type == DEBT && transaction.dest_id != 0))
    {
        balSpan = ce('span');
        balSpan.textContent = this.model.currency.formatCurrency(transaction.dest_result, transaction.dest_curr);
        transBalanceItem.appendChild(balSpan);
    }
};


/**
 * Look for list item with specified identifier
 * @param {number} id - transaction identifier
 */
TransactionListView.prototype.findListItemById = function(id)
{
    return this.listItems.querySelector('[data-id="' + id + '"]');
};


/**
 * Transaction block click event handler
 * @param {Event} e - click event object
 */
TransactionListView.prototype.onTransClick = function(e)
{
    var listItemElem = this.findListItemElement(e.target);
    if (!listItemElem || !listItemElem.dataset)
        return;

    var transaction_id = parseInt(listItemElem.dataset.id);
    var transaction = this.getTransaction(transaction_id);
    if (!transaction)
        return;

    if (this.model.selection.isSelected(transaction_id))
    {
        this.model.selection.deselect(transaction_id);
        listItemElem.classList.remove('trans-list__item_selected');
    }
    else
    {
        this.model.selection.select(transaction_id);
        listItemElem.classList.add('trans-list__item_selected');
    }

    this.toolbar.updateBtn.show(this.model.selection.count() == 1);
    this.toolbar.deleteBtn.show(this.model.selection.count() > 0);

    var selArr = this.model.selection.getIdArray();
    this.delTransInp.value = selArr.join();

    if (this.model.selection.count() == 1)
    {
        this.toolbar.updateBtn.setURL(baseURL + 'transactions/edit/' + selArr[0]);
    }

	this.toolbar.show(this.model.selection.count() > 0);
};



/**
 * Sent AJAX request to server to change position of transaction
 * @param {number} trans_id - identifier of transaction to change position
 * @param {number} newPos  - new position of transaction
 */
TransactionListView.prototype.sendChangePosRequest = function(trans_id, newPos)
{
    ajax.post({
        url : baseURL + 'api/transaction/setpos',
        data : JSON.stringify({ 'id' : trans_id, 'pos' : newPos }),
        headers : { 'Content-Type' : 'application/json' },
        callback : this.onChangePosCallback(trans_id, newPos)
    });
};


/**
 * Return callback function for position change request
 * @param {number} trans_id - identifier of transaction to change position
 * @param {number} newPos - new position of transaction
 */
TransactionListView.prototype.onChangePosCallback = function(trans_id, newPos)
{
    return function(response)
    {
        var res = JSON.parse(response);
        if (res && res.result == 'ok')
        {
            this.updateTransArrPos(trans_id, newPos);
        }
        else
        {
            this.cancelPosChange(trans_id);
        }
    }.bind(this);
};


/**
 * Update local transactions array on successfull result from server
 * @param {number} trans_id - identifier of transaction to change position
 * @param {number} newPos - new position of transaction
 */
TransactionListView.prototype.updateTransArrPos = function(trans_id, newPos)
{
    this.setPosition(trans_id, newPos);
};


/**
 * Cancel local changes on transaction position update fail
 * @param {number} trans_id - identifier of transaction
 */
TransactionListView.prototype.cancelPosChange = function(trans_id)
{
    if (!this.trListSortable || this.trListSortable.dragFrom == -1)
        return;

    var origTr = this.findListItemById(trans_id);
    if (!origTr || !origTr.parentNode)
        return;

    var origWrap = origTr.parentNode;
    if (this.trListSortable.dragFrom == 0)
    {
        prependChild(origWrap.parentNode, origWrap);
    }
    else
    {
        var trBefore = this.findListItemById(trListSortable.dragFrom);
        if (!trBefore || !trBefore.parentNode)
            return;

        var trBeforeWrap = trBefore.parentNode;

        insertAfter(origWrap, trBeforeWrap);
    }

    createMessage('Fail to change position of transaction.', 'msg_error');
};


/**
 * Find closest list item element to specified
 * @param {Element} elem - element to start looking from
 */
TransactionListView.prototype.findListItemElement = function(elem)
{
    if (!elem)
        return null;

    var selector = (filterObj.mode == 'details') ? 'tr' : '.trans-list__item';

    var res = elem.querySelector(selector);
    if (!res)
        return elem.closest(selector);

    return res;
};


/**
 * Return transaction id from transaction item element
 * @param {Element} elem - target list item element
 */
TransactionListView.prototype.transIdFromElem = function(elem)
{
    var listItemElem = this.findListItemElement(elem);
    if (!listItemElem || !listItemElem.dataset)
        return 0;

    return parseInt(listItemElem.dataset.id);
};


/**
 * Transaction drag start event handler
 * @param {Element} elem - transaction list item element
 */
TransactionListView.prototype.onTransDragStart = function(elem)
{
    if (!this.trListSortable || !elem)
        return;

    var prevElem = elem.previousElementSibling;

    this.trListSortable.dragFrom = this.transIdFromElem(prevElem);
};


/**
 * Transaction item drop callback
 * @param {number} trans_id - identifier of moving transaction
 * @param {number} retrans_id - identifier of replaced transaction
 */
TransactionListView.prototype.onTransPosChanged = function(elem, refElem)
{
    var transaction_id = this.transIdFromElem(elem);
    var ref_id = this.transIdFromElem(refElem);
    if (!transaction_id || !ref_id)
        return;

    var replacedItem = this.getTransaction(ref_id);
    if (replacedItem)
    {
        this.sendChangePosRequest(transaction_id, replacedItem.pos);
    }
};


/**
 * Build new location address from current filterObj
 */
TransactionListView.prototype.buildAddress = function()
{
    var newLocation = baseURL + 'transactions/';
    var locFilter = {};

    setParam(locFilter, filterObj);

    if ('type' in locFilter)
    {
        if (!Array.isArray(locFilter.type))
            locFilter.type = [ locFilter.type ];

        if (!locFilter.type.length)
            delete locFilter.type;
    }

    if ('acc_id' in filterObj)
    {
        if (!Array.isArray(locFilter.acc_id))
            locFilter.acc_id = [ locFilter.acc_id ];

        if (!locFilter.acc_id.length)
            delete locFilter.acc_id;
    }

    if (!isEmpty(locFilter))
        newLocation += '?' + urlJoin(locFilter);

    return newLocation;
};


/**
 * Transaction type checkbox click event handler
 * @param {Event} e - click event
 */
TransactionListView.prototype.onToggleTransType = function(e)
{
    var itemElem = e.target.closest('.trtype-menu__item');
    if (!itemElem || !itemElem.dataset)
        return;

    var selectedType = parseInt(itemElem.dataset.type);

    if (!('type' in filterObj))
        filterObj.type = [];
    if (!Array.isArray(filterObj.type))
        filterObj.type = [ filterObj.type ];

    var ind = filterObj.type.indexOf(selectedType);
    if (ind === -1)
        filterObj.type.push(selectedType);
    else
        filterObj.type.splice(ind, 1);

    window.location = this.buildAddress();
};


/**
 * Account change event handler
 * @param {object} obj - selection object
 */
TransactionListView.prototype.onAccountChange = function(obj)
{
    // Check all accounts from the new selection present in current selection
    var data = Array.isArray(obj) ? obj : [ obj ];
    var reloadNeeded = data.some(function(item)
    {
        if (!filterObj.acc_id || !filterObj.acc_id.includes(parseInt(item.id)))
        {
            return true;
        }

        return false;
    });

    // Check all currenlty selected accounts present in the new selection
    if (!reloadNeeded)
    {
        reloadNeeded = filterObj.acc_id.some(function(acc_id)
        {
            return !data.find(function(item)
            {
                return item.id == acc_id;
            })
        });
    }

    if (!reloadNeeded)
        return;

    // Prepare parameters
    filterObj.acc_id = data.map(function(item)
    {
        return parseInt(item.id);
    });

    // Clear page number because list of transactions guaranteed to change on change accounts filter
    if ('page' in filterObj)
        delete filterObj.page;

    window.location = this.buildAddress();
};


/**
 * Transaction search form submit event handler
 * @param {Event} e - submit event
 */
TransactionListView.prototype.onSearchSubmit = function(e)
{
    if (!this.searchInp)
        return false;

    e.preventDefault();

    if (this.searchInp.value.length)
        filterObj.search = this.searchInp.value;
    else if ('search' in filterObj)
        delete filterObj['search'];

    // Clear page number because list of transactions guaranteed to change on change search query
    if ('page' in filterObj)
        delete filterObj.page;

    window.location = this.buildAddress();
};


/**
 * Delete confirmation result handler
 * @param {boolean} result - user confirmed delete
 */
TransactionListView.prototype.onDeleteConfirmResult = function(result)
{
    if (this.delConfirmPopup)
        this.delConfirmPopup.close();

    if (result)
    {
        this.delForm.submit();
    }
};


/**
 * Create and show transaction delete warning popup
 */
TransactionListView.prototype.showDeletePopup = function()
{
    if (this.model.selection.count() == 0)
        return;

    var multi = (this.model.selection.count() > 1);

    if (!this.delConfirmPopup)
    {
        this.delConfirmPopup = Popup.create({
            id : 'delete_warning',
            content : (multi) ? multiTransDeleteMsg : singleTransDeleteMsg,
            btn : {
                okBtn : { onclick : this.onDeleteConfirmResult.bind(this, true) },
                cancelBtn : { onclick : this.onDeleteConfirmResult.bind(this, false) }
            }
        });
    }

    this.delConfirmPopup.setTitle((multi) ? multiTransDeleteTitle : singleTransDeleteTitle);
    this.delConfirmPopup.setContent((multi) ? multiTransDeleteMsg : singleTransDeleteMsg);

    this.delConfirmPopup.show();
};


/**
 * Date range select calback
 * @param {object} range - selected range object
 */
TransactionListView.prototype.onRangeSelect = function(range)
{
    if (!range || !isDate(range.start) || !isDate(range.end))
        return;

    this.model.selDateRange = range;

    this.datePicker.hide();

    this.dateInput.value = DatePicker.format(range.start) + ' - ' + DatePicker.format(range.end);
};


/**
 * Date picker hide callback
 */
TransactionListView.prototype.onDatePickerHide = function()
{
    if (!this.model.selDateRange)
        return;

    var newStartDate = DatePicker.format(this.model.selDateRange.start);
    var newEndDate = DatePicker.format(this.model.selDateRange.end);

    if (filterObj.stdate == newStartDate && filterObj.enddate == newEndDate)
        return;

    filterObj.stdate = newStartDate;
    filterObj.enddate = newEndDate;

    // Clear page number because list of transactions guaranteed to change on change date range
    if ('page' in filterObj)
        delete filterObj.page;

    window.location = this.buildAddress();
};


/**
 * Show calendar block
 */
TransactionListView.prototype.showCalendar = function()
{
    if (!this.datePicker)
    {
        this.datePicker = DatePicker.create({
            wrapper : this.datePickerWrapper,
            relparent : this.datePickerWrapper.parentNode,
            range : true,
            onrangeselect : this.onRangeSelect.bind(this),
            onhide : this.onDatePickerHide.bind(this)
        });
    }
    if (!this.datePicker)
        return;

    this.datePicker.show(!this.datePicker.visible());

    this.datePickerBtn.hide();
    show(this.dateBlock, true);

    setEmptyClick(this.datePicker.hide.bind(this.datePicker), [
        this.datePickerWrapper,
        this.datePickerBtn.elem,
        this.dateInputBtn
    ]);
};
