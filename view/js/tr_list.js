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
				src_bal = trans.src_balance + trans.src_amount;		// trans.src_bal - trans.src_amount
			trans.src_balance = src_bal - trans.src_amount;
		}
		else
		{
			trans.src_balance = 0;
		}

		if (trans.dest_id != 0)
		{
			if (dest_bal === null)
				dest_bal = trans.dest_balance - trans.dest_amount;		// trans.dest_bal + trans.dest_amount
			trans.dest_balance = dest_bal + trans.dest_amount;
		}
		else
		{
			trans.dest_balance = 0;
		}

		trRow = ge('tr_' + trans.id);
		if (!trRow)	// tr
			return;
		trBalanceItem = firstElementChild(trRow);		// td
		if (!trBalanceItem)
			return;
		trBalanceItem = nextElementSibling(trBalanceItem);
		if (!trBalanceItem)
			return;
		trBalanceItem = nextElementSibling(trBalanceItem);
		if (!trBalanceItem)
			return;
		trBalanceItem = firstElementChild(trBalanceItem);		// div tritem_balance
		if (!trBalanceItem)
			return;

		removeChilds(trBalanceItem);

		var balSpan;

		if (trans.type == EXPENSE || trans.type == TRANSFER || (trans.type == DEBT && trans.src_id != 0))
		{
			balSpan = ce('span');
			balSpan.innerHTML = formatCurrency(trans.src_balance, trans.src_curr);
			trBalanceItem.appendChild(balSpan);
		}

		if (trans.type == INCOME || trans.type == TRANSFER || (trans.type == DEBT && trans.dest_id != 0))
		{
			balSpan = ce('span');
			balSpan.innerHTML = formatCurrency(trans.dest_balance, trans.dest_curr);
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
					initBalArr[trans.src_id] = trans.src_balance + trans.src_amount;
				}

				if (trans.dest_id && initBalArr[trans.dest_id] === undefined)
				{
					initBalArr[trans.dest_id] = trans.dest_balance - trans.dest_amount;
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

					tBalanceArr[trans.src_id] = trans.src_balance;
					tBalanceArr[trans.dest_id] = trans.dest_balance;
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


// Transaction block click event handler
function onTransClick(tr_id)
{
	var transObj, edit_btn, del_btn, deltrans;
	var actDiv;
	var selArr;

	transObj = ge('tr_' + tr_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	deltrans = ge('deltrans');
	if (!transObj || !edit_btn || !deltrans)
		return;

	if (trSelection.isSelected(tr_id))
	{
		trSelection.deselect(tr_id);

		transObj.className = (filterObj.mode == 'details') ? '' : 'trlist_item';
	}
	else
	{
		trSelection.select(tr_id);

		transObj.className = 'act_tr';
	}

	show(edit_btn, (trSelection.count() == 1));
	show(del_btn, (trSelection.count() > 0));

	selArr = trSelection.getIdArray();
	deltrans.value = selArr.join();

	if (trSelection.count() == 1)
	{
		if (firstElementChild(edit_btn) && firstElementChild(edit_btn).tagName.toLowerCase() == 'a')
			firstElementChild(edit_btn).href = baseURL + 'transactions/edit/' + selArr[0];
	}

	show('toolbar', (trSelection.count() > 0));
	if (trSelection.count() > 0)
	{
		onScroll();
	}
}


// Account select callback
function onAccountSel(obj)
{
	var sArr = [], str = '';

	if (!obj)
		return;

	for(var id in obj)
	{
		sArr.push(obj[id]);
	}

	str = sArr.join(', ');

	this.setText(str);
}


// Initialization of page controls
function initControls()
{
	var isMobile;
	var accDDList;

	isMobile = (document.documentElement.clientWidth < 700);

	accDDList = new DDList();
	if (!accDDList.create({ input_id : 'acc_id',
						selCB : onAccountSel,
						selmsg : 'Select account',
						changecb : onAccountChange,
						editable : false,
						mobile : isMobile }))
		accDDList = null;
}


// Initialization of drag and drop features
function initTransListDrag()
{
	var trlist, listItem_wr, listItem, trans_id;

	initControls();

	trlist = ge('tritems');
	if (!trlist)
		return;

	trListSortable = new Sortable({ ondragstart : onTransDragStart,
		 							oninsertat : onTransPosChanged,
									container : 'tritems',
									group : 'transactions',
									selector : '.trlist_item_wrap',
									placeholderClass : 'trlist_item_placeholder',
									copyWidth : true,
									table : (filterObj.mode == 'details') });

// dragFrom is transaction id before transaction started to drag
// 0 if drag first transaction, -1 if no draggin currently
	trListSortable.dragFrom = -1;

	listItem_wr = firstElementChild(trlist);
	listItem = null;
	while(listItem_wr)
	{
		if ((filterObj.mode == 'details' && listItem_wr.tagName == 'TBODY') ||
			(filterObj.mode != 'details' && hasClass(listItem_wr, 'trlist_item_wrap')))
		{
			listItem = firstElementChild(listItem_wr);
			trans_id = transIdFromElem(listItem);
			if (trans_id)
			{
				listItem.onclick = onTransClick.bind(null, trans_id);
				listItem.style.cursor = 'pointer';
			}
		}

		listItem_wr = nextElementSibling(listItem_wr);
	}
}


// Sent AJAX request to server to change position of transaction
function sendChangePosRequest(trans_id, newPos)
{
	var params = { 'id' : trans_id, 'pos' : newPos };

	ajax.post(baseURL + 'api/transaction/setpos', urlJoin(params), onChangePosCallback(trans_id, newPos));
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
	var origTr, origWrap, trBefore, trBeforeWrap;

	if (!trListSortable || trListSortable.dragFrom == -1)
		return;

	origTr = ge('tr_' + trans_id);
	if (!origTr || !origTr.parentNode)
		return;

	origWrap = origTr.parentNode;
	if (trListSortable.dragFrom == 0)
	{
		prependChild(origWrap.parentNode, origWrap);
	}
	else
	{
		trBefore = ge('tr_' + trListSortable.dragFrom);
		if (!trBefore || !trBefore.parentNode)
			return;

		trBeforeWrap = trBefore.parentNode;

		insertAfter(origWrap, trBeforeWrap);
	}

	createMessage('Fail to change position of transaction.', 'msg_error');
}


// Return transaction id from transaction item element
function transIdFromElem(elem)
{
	return (elem && elem.id.length > 3) ? parseInt(elem.id.substr(3)) : 0;
}


// Transaction drag start callback
function onTransDragStart(trans_id)
{
	if (!trListSortable)
		return;

	trListSortable.dragFrom = transIdFromElem(firstElementChild(previousElementSibling(trans_id)));
}


// Transaction item drop callback
function onTransPosChanged(trans_id, retrans_id)
{
	var replacedItem, newPos;
	var tr_id, retr_id;

	tr_id = transIdFromElem(firstElementChild(trans_id));
	retr_id = transIdFromElem(firstElementChild(retrans_id));
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

	if (locFilter.acc_id.length)
		locFilter.acc_id = locFilter.acc_id.join();
	else if ('acc_id' in filterObj)
		delete filterObj['acc_id'];

	for(var name in locFilter)
	{
		if (typeof locFilter[name] == 'string')
			locFilter[name] = encodeURIComponent(locFilter[name]);
	}

	if (!isEmpty(locFilter))
		newLocation += '?' + urlJoin(locFilter);

	return newLocation;
}


// Account change event handler
function onAccountChange(obj)
{
	var acc;
	var reloadNeeded = false;

	// Check all accounts from the new selection present in current selection
	for(acc in obj)
	{
		if (filterObj.acc_id.indexOf(parseInt(acc)) == -1)
		{
			reloadNeeded = true;
			break;
		}
	}

	// Check all currenlty selected accounts present in the new selection
	if (!reloadNeeded)
	{
		if (filterObj.acc_id.some(function(acc_id){ return !(acc_id in obj); }))
			reloadNeeded = true;
	}

	if (!reloadNeeded)
		return;

	// Prepare parameters
	filterObj.acc_id = [];
	for(acc in obj)
	{
		filterObj.acc_id.push(parseInt(acc));
	}

	window.location = buildAddress();
}


// Transaction search form submit event handler
function onSearchSubmit(frm)
{
	var searchInp;

	searchInp = ge('search');
	if (!searchInp)
		return false;

	if (searchInp.value.length)
		filterObj.search = searchInp.value;
	else if ('search' in filterObj)
		delete filterObj['search'];

	window.location = buildAddress();

	return false;
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

	datefield.value = Calendar.format(range.start) + ' - ' + Calendar.format(range.end);
}


// Date picker hide callback
function onDatePickerHide()
{
	if (!selRange)
		return;

	filterObj.stdate = Calendar.format(selRange.start);
	filterObj.enddate = Calendar.format(selRange.end);

	window.location = buildAddress();
}


// Show calendar block
function showCalendar()
{
	if (!calendarObj)
	{
		calendarObj = Calendar.create({ wrapper_id : 'calendar',
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
