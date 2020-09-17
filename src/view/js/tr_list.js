var dwPopup = null;
var calendarObj = null;
var selRange = null;


var transactions = (function()
{
	function find(tr_id)
	{
		return idSearch(transArr, tr_id);
	}


	function updateBalance(trans, src_bal, dest_bal)
	{
		var trRow, trBalanceItem;

		if (!trans)
			return;

		if (trans.src_id != 0)
		{
			if (src_bal === null)
				src_bal = trans.src_result + trans.src_amount;
			trans.src_result = src_bal - trans.src_amount;
		}
		else
		{
			trans.src_result = 0;
		}

		if (trans.dest_id != 0)
		{
			if (dest_bal === null)
				dest_bal = trans.dest_result - trans.dest_amount;
			trans.dest_result = dest_bal + trans.dest_amount;
		}
		else
		{
			trans.dest_result = 0;
		}

		trRow = findListItemById(trans.id);
		if (!trRow)	// tr
			return;
		trBalanceItem = trRow.firstElementChild;		// td
		if (!trBalanceItem)
			return;
		trBalanceItem = trBalanceItem.nextElementSibling;
		if (!trBalanceItem)
			return;
		trBalanceItem = trBalanceItem.nextElementSibling;
		if (!trBalanceItem)
			return;
		trBalanceItem = trBalanceItem.firstElementChild;		// div tritem_balance
		if (!trBalanceItem)
			return;

		removeChilds(trBalanceItem);

		var balSpan;

		if (trans.type == EXPENSE || trans.type == TRANSFER || (trans.type == DEBT && trans.src_id != 0))
		{
			balSpan = ce('span');
			balSpan.innerHTML = formatCurrency(trans.src_result, trans.src_curr);
			trBalanceItem.appendChild(balSpan);
		}

		if (trans.type == INCOME || trans.type == TRANSFER || (trans.type == DEBT && trans.dest_id != 0))
		{
			balSpan = ce('span');
			balSpan.innerHTML = formatCurrency(trans.dest_result, trans.dest_curr);
			trBalanceItem.appendChild(balSpan);
		}
	}


	function posCompare(tr1, tr2)
	{
		if (tr1.pos < tr2.pos)
			return -1;
		else if (tr1.pos > tr2.pos)
			return 1;

		return 0;
	}


	function setPosition(tr_id, pos)
	{
		var tr_info, oldPos;

		tr_info = find(tr_id);
		if (!tr_info)
			return false;

		oldPos = tr_info.pos;
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
				if (trans.id == tr_id)
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

				if (trans.src_id && initBalArr[trans.src_id] === undefined)
				{
					initBalArr[trans.src_id] = trans.src_result + trans.src_amount;
				}

				if (trans.dest_id && initBalArr[trans.dest_id] === undefined)
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
							updateBalance(trans, src_bal, dest_bal);
						}
					}
					else if (pos < oldPos)		// moving up
					{
						if (trans.pos >= pos && trans.pos <= oldPos)
						{
							updateBalance(trans, src_bal, dest_bal);
						}
					}
					else if (pos > oldPos)		// moving down
					{
						if (trans.pos >= oldPos && trans.pos <= pos)
							updateBalance(trans, src_bal, dest_bal);
					}

					tBalanceArr[trans.src_id] = trans.src_result;
					tBalanceArr[trans.dest_id] = trans.dest_result;
				}, this);
			}
		}

		return true;
	}


	return {
		findById: function(tr_id)
		{
			return find(tr_id);
		},


		setPos : function(tr_id, pos)
		{
			return setPosition(tr_id, pos);
		}
	};
})();


var trSelection = new Selection();
var trListSortable = null;


function findListItemById(id)
{
	var trlist = ge('tritems');
	if (!trlist)
		return null;

	return trlist.querySelector('[data-id="' + id + '"]');
}


// Transaction block click event handler
function onTransClick(e)
{
	var listItemElem = findListItemElement(e.target);
	if (!listItemElem || !listItemElem.dataset)
		return;

	var transaction_id = parseInt(listItemElem.dataset.id);
	var transaction = transactions.findById(transaction_id);
	if (!transaction)
		return;

	var edit_btn = ge('edit_btn');
	var del_btn = ge('del_btn');
	var deltrans = ge('deltrans');
	if (!edit_btn || !del_btn || !deltrans)
		return;

	if (trSelection.isSelected(transaction_id))
	{
		trSelection.deselect(transaction_id);
		listItemElem.classList.remove('trans-list__item_selected');
	}
	else
	{
		trSelection.select(transaction_id);
		listItemElem.classList.add('trans-list__item_selected');
	}

	show(edit_btn, (trSelection.count() == 1));
	show(del_btn, (trSelection.count() > 0));

	var selArr = trSelection.getIdArray();
	deltrans.value = selArr.join();

	if (trSelection.count() == 1)
	{
		if (edit_btn.firstElementChild && edit_btn.firstElementChild.tagName.toLowerCase() == 'a')
			edit_btn.firstElementChild.href = baseURL + 'transactions/edit/' + selArr[0];
	}

	show('toolbar', (trSelection.count() > 0));
	if (trSelection.count() > 0)
	{
		onScroll();
	}
}


// Initialization of page controls
function initControls()
{
	var typeMenu = document.querySelector('.trtype-menu');
	typeMenu.addEventListener('click', onToggleTransType);

	DropDown.create({
		input_id : 'acc_id',
		placeholder : 'Select account',
		onchange : onAccountChange,
		editable : false
	});

	var searchFrm = ge('searchFrm');
	if (searchFrm)
		searchFrm.addEventListener('submit', onSearchSubmit);

	var searchInp = ge('search');
	if (searchInp)
		searchInp.inputMode = 'search';

	var btn;
	var calendar_btn = ge('calendar_btn');
	if (calendar_btn)
	{
		btn = calendar_btn.firstElementChild;
		if (btn)
			btn.onclick = showCalendar;
	}

	btn = ge('cal_rbtn');
	if (btn)
		btn.onclick = showCalendar;

	var del_btn = ge('del_btn');
	if (del_btn)
	{
		btn = del_btn.firstElementChild;
		if (btn)
			btn.onclick = showDeletePopup;
	}
}


// Initialization of drag and drop features
function initTransListDrag()
{
	initControls();

	var trlist = ge('tritems');
	if (!trlist)
		return;

	trListSortable = new Sortable({ ondragstart : onTransDragStart,
		 							oninsertat : onTransPosChanged,
									container : 'tritems',
									group : 'transactions',
									selector : '.trans-list__item-wrapper',
									placeholderClass : 'trans-list__item-placeholder',
									copyWidth : true,
									table : (filterObj.mode == 'details') });

// dragFrom is transaction id before transaction started to drag
// 0 if drag first transaction, -1 if no draggin currently
	trListSortable.dragFrom = -1;

	trlist.addEventListener('click', onTransClick);
}


// Sent AJAX request to server to change position of transaction
function sendChangePosRequest(trans_id, newPos)
{
	ajax.post({
		url : baseURL + 'api/transaction/setpos',
		data : JSON.stringify({ 'id' : trans_id, 'pos' : newPos }),
		headers : { 'Content-Type' : 'application/json' },
		callback : onChangePosCallback(trans_id, newPos)
	});
}


// Return callback function for position change request
function onChangePosCallback(trans_id, newPos)
{
	return function(response)
	{
		var res = JSON.parse(response);
		if (res && res.result == 'ok')
		{
			updateTransArrPos(trans_id, newPos);
		}
		else
		{
			cancelPosChange(trans_id);
		}
	}
}


// Update local transactions array on successfull result from server
function updateTransArrPos(trans_id, newPos)
{
	transactions.setPos(trans_id, newPos);
}


// Cancel local changes on transaction position update fail
function cancelPosChange(trans_id)
{
	if (!trListSortable || trListSortable.dragFrom == -1)
		return;

	var origTr = findListItemById(trans_id);
	if (!origTr || !origTr.parentNode)
		return;

	var origWrap = origTr.parentNode;
	if (trListSortable.dragFrom == 0)
	{
		prependChild(origWrap.parentNode, origWrap);
	}
	else
	{
		var trBefore = findListItemById(trListSortable.dragFrom);
		if (!trBefore || !trBefore.parentNode)
			return;

		var trBeforeWrap = trBefore.parentNode;

		insertAfter(origWrap, trBeforeWrap);
	}

	createMessage('Fail to change position of transaction.', 'msg_error');
}


function findListItemElement(elem)
{
	if (!elem)
		return null;

	return elem.closest((filterObj.mode == 'details') ? 'tr' : '.trans-list__item');
}


// Return transaction id from transaction item element
function transIdFromElem(elem)
{
	var listItemElem = findListItemElement(elem);
	if (!listItemElem || !listItemElem.dataset)
		return 0;

	return parseInt(listItemElem.dataset.id);
}


// Transaction drag start callback
function onTransDragStart(trans_id)
{
	if (!trListSortable || !trans_id)
		return;

	var elem = trans_id.previousElementSibling;
	if (elem)
		elem = elem.firstElementChild;

	trListSortable.dragFrom = transIdFromElem(elem);
}


// Transaction item drop callback
function onTransPosChanged(trans_id, retrans_id)
{
	var replacedItem, newPos;
	var tr_id, retr_id;

	if (!trans_id || !retrans_id)
		return;

	tr_id = transIdFromElem(trans_id.firstElementChild);
	retr_id = transIdFromElem(retrans_id.firstElementChild);
	if (!tr_id || !retr_id)
		return;

	replacedItem = transactions.findById(retr_id);

	if (replacedItem)
	{
		newPos = replacedItem.pos;
		sendChangePosRequest(tr_id, newPos);
	}
}


// Build new location address from current filterObj
function buildAddress()
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
}


// Transaction type checkbox click event handler
function onToggleTransType(e)
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

	window.location = buildAddress();
}


// Account change event handler
function onAccountChange(obj)
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

	window.location = buildAddress();
}


// Transaction search form submit event handler
function onSearchSubmit(e)
{
	var searchInp = ge('search');
	if (!searchInp)
		return false;

	if (searchInp.value.length)
		filterObj.search = searchInp.value;
	else if ('search' in filterObj)
		delete filterObj['search'];

	// Clear page number because list of transactions guaranteed to change on change search query
	if ('page' in filterObj)
		delete filterObj.page;

	window.location = buildAddress();

	e.preventDefault();
}


var singleTransDeleteTitle = 'Delete transaction';
var multiTransDeleteTitle = 'Delete transactions';
var multiTransDeleteMsg = 'Are you sure want to delete selected transactions?<br>Changes in the balance of affected accounts will be canceled.';
var singleTransDeleteMsg = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';


// Delete popup callback
function onDeletePopup(res)
{
	var delform;

	if (dwPopup)
		dwPopup.close();

	if (res)
	{
		delform = ge('delform');
		if (delform)
			delform.submit();
	}
}


// Create and show transaction delete warning popup
function showDeletePopup()
{
	var multi;

	if (trSelection.count() == 0)
		return;

	multi = (trSelection.count() > 1);

	if (!dwPopup)
	{
		dwPopup = Popup.create({ id : 'delete_warning',
						content : (trSelection.count() > 1) ? multiTransDeleteMsg : singleTransDeleteMsg,
						btn : { okBtn : { onclick : onDeletePopup.bind(null, true) },
						cancelBtn : { onclick : onDeletePopup.bind(null, false) } }
					});
	}

	dwPopup.setTitle((multi) ? multiTransDeleteTitle : singleTransDeleteTitle);
	dwPopup.setContent((multi) ? multiTransDeleteMsg : singleTransDeleteMsg);

	dwPopup.show();
}


// Date range select calback
function onRangeSelect(range)
{
	var datefield;

	if (!range || !isDate(range.start) || !isDate(range.end))
		return;

	datefield = ge('date');
	if (!datefield)
		return;

	selRange = range;

	calendarObj.hide();

	datefield.value = DatePicker.format(range.start) + ' - ' + DatePicker.format(range.end);
}


// Date picker hide callback
function onDatePickerHide()
{
	if (!selRange)
		return;

	var newStartDate = DatePicker.format(selRange.start);
	var newEndDate = DatePicker.format(selRange.end);

	if (filterObj.stdate == newStartDate && filterObj.enddate == newEndDate)
		return;

	filterObj.stdate = newStartDate;
	filterObj.enddate = newEndDate;

	// Clear page number because list of transactions guaranteed to change on change date range
	if ('page' in filterObj)
		delete filterObj.page;

	window.location = buildAddress();
}


// Show calendar block
function showCalendar()
{
	if (!calendarObj)
	{
		calendarObj = DatePicker.create({ wrapper_id : 'calendar',
										relparent : ge('calendar').parentNode,
										range : true,
										onrangeselect : onRangeSelect,
										onhide : onDatePickerHide });
		if (!calendarObj)
			return;
	}

	self.calendarObj.show(!self.calendarObj.visible());

	show('calendar_btn', false);
	show('date_block', true);

	setEmptyClick(self.calendarObj.hide.bind(self.calendarObj), ['calendar', 'calendar_btn', 'cal_rbtn']);
}
