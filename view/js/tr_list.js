var dwPopup;
var calendarObj = null;
var selRange = null;
var baseURL = 'http://jezve.net/money/';


var transactions =
{
	selectedArr : [],

	// Return position of transaction in selectedArr
	getPos : function(acc_id)
	{
		return this.selectedArr.indexOf(acc_id);
	},


	isSelected : function(tr_id)
	{
		return this.selectedArr.some(function(trans_id){ return trans_id == tr_id; });
	},


	select : function(tr_id)
	{
		if (!tr_id || this.isSelected(tr_id))
			return false;

		this.selectedArr.push(tr_id);
		return true;
	},


	deselect : function(tr_id)
	{
		var tr_pos = this.getPos(tr_id);

		if (tr_pos == -1)
			return false;

		this.selectedArr.splice(tr_pos, 1);
		return true;
	},


	selectedCount : function()
	{
		return this.selectedArr.length;
	},


	findById : function(tr_id)
	{
		var tr_info = null;

		if (transArr)
		{
			transArr.some(function(trans)
			{
				if (trans[0] == tr_id)
					tr_info = trans; 
			});
		}

		return tr_info;
	},


	updateBalance : function(trans, src_bal, dest_bal)
	{
		var tr_id, tr_type, src_amount, dest_amount;
		var trRow, trBalanceItem;

		if (!trans)
			return;

		tr_id = trans[0];
		tr_type = trans[5];
		src_amount = trans[12];
		dest_amount = trans[13];

		if (trans[1] != 0)
		{
			if (src_bal === null)
				src_bal = trans[9] + src_amount;		// trans.src_bal - trans.src_amount
			trans[9] = src_bal - src_amount;
		}
		else
		{
			trans[9] = 0;
		}

		if (trans[2] != 0)
		{
			if (dest_bal === null)
				dest_bal = trans[10] - dest_amount;		// trans.dest_bal + trans.dest_amount
			trans[10] = dest_bal + dest_amount;
		}
		else
		{
			trans[10] = 0;
		}

		trRow = ge('tr_' + tr_id);
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

		if (tr_type == 1 || tr_type == 3 || (tr_type == 4 && trans[1] != 0))
		{
			balSpan = ce('span');
			if (tr_type == 4 && trans[11] == 1)
				balSpan.innerHTML = formatCurrency(trans[9], trans[14]);
			else
				balSpan.innerHTML = formatCurrency(trans[9], getCurrencyOfAccount(src_id));
			trBalanceItem.appendChild(balSpan);
		}

		if (tr_type == 2 || tr_type == 3 || (tr_type == 4 && trans[2] != 0))
		{
			balSpan = ce('span');
			if (tr_type == 4 && trans[11] == 2)
				balSpan.innerHTML = formatCurrency(trans[10], trans[14]);
			else
				balSpan.innerHTML = formatCurrency(trans[10], getCurrencyOfAccount(dest_id));
			trBalanceItem.appendChild(balSpan);
		}
	},


	setPos : function(tr_id, pos)
	{
		var tr_info, oldPos;

		tr_info = this.findById(tr_id);
		if (!tr_info)
			return false;

		oldPos = tr_info[8];
		if (oldPos == pos)
		{
			return true;
		}
		else
		{
			var initBalArr = [];

			transArr.sort(function(tr1, tr2)
			{
				if (tr1[8] < tr2[8])
					return -1;
				else if (tr1[8] > tr2[8])
					return 1;

				return 0;
			});

			transArr.forEach(function(trans)
			{
				src_id = trans[1];
				dest_id = trans[2];
				tr_type = trans[5];

				if (trans[0] == tr_id)
				{
					trans[8] = pos;
				}
				else
				{
					if (oldPos == 0)			// insert with specified position
					{
						if (trans[8] >= pos)
							trans[8] += 1;
					}
					else if (pos < oldPos)		// moving up
					{
						if (trans[8] >= pos && trans[8] < oldPos)
							trans[8] += 1;
					}
					else if (pos > oldPos)		// moving down
					{
						if (trans[8] > oldPos && trans[8] <= pos)
							trans[8] -= 1;
					}
				}

				if (src_id && initBalArr[src_id] === undefined)
				{
					if (tr_type == 1 || tr_type == 3 || (tr_type == 4 && trans[11] == 2))	// expense, transfer or debt
						initBalArr[src_id] = trans[9] + trans[13];		// src_bal + charge
					else if (tr_type == 4 && trans[11] == 1)
						initBalArr[src_id] = trans[9] + trans[12];		// src_bal + amount
				}

				if (dest_id && initBalArr[dest_id] === undefined)
				{
					if (tr_type == 2 || tr_type == 3 || (tr_type == 4 && trans[11] == 1))				// income, transfer or debt
						initBalArr[dest_id] = trans[10] - trans[13];		// dest_bal - charge
					else if (tr_type == 4 && trans[11] == 2)
						initBalArr[dest_id] = trans[10] - trans[12];	// dest_bal - amount
				}
			});

			// Sort array of  transaction by position again
			transArr.sort(function(tr1, tr2)
			{
				if (tr1[8] < tr2[8])
					return -1;
				else if (tr1[8] > tr2[8])
					return 1;

				return 0;
			});

			if (detailsMode)
			{
				var tBalanceArr = [];

				transArr.forEach(function(trans)
				{
					src_id = trans[1];
					dest_id = trans[2];

					src_bal = (src_id != 0 && tBalanceArr[src_id] !== undefined) ? tBalanceArr[src_id] : initBalArr[src_id];
					dest_bal = (dest_id != 0 && tBalanceArr[dest_id] !== undefined) ? tBalanceArr[dest_id] : initBalArr[dest_id];

					if (oldPos == 0)			// insert with specified position
					{
						if (trans[8] >= pos)
						{
							this.updateBalance(trans, src_bal, dest_bal);
						}
					}
					else if (pos < oldPos)		// moving up
					{
						if (trans[8] >= pos && trans[8] <= oldPos)
						{
							this.updateBalance(trans, src_bal, dest_bal);
						}
					}
					else if (pos > oldPos)		// moving down
					{
						if (trans[8] >= oldPos && trans[8] <= pos)
							this.updateBalance(trans, src_bal, dest_bal);
					}

					tBalanceArr[src_id] = trans[9];
					tBalanceArr[dest_id] = trans[10];
				}, this);
			}
		}

		return true;
	}
};



// Transaction block click event handler
function onTransClick(tr_id)
{
	var transObj, edit_btn, del_btn, deltrans;
	var actDiv;

	transObj = ge('tr_' + tr_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	deltrans = ge('deltrans');
	if (!transObj || !edit_btn || !deltrans)
		return;

	if (transactions.isSelected(tr_id))
	{
		transactions.deselect(tr_id);

		transObj.className = (detailsMode) ? '' : 'trlist_item';
	}
	else
	{
		transactions.select(tr_id);

		transObj.className = 'act_tr';
	}

	show(edit_btn, (transactions.selectedCount() == 1));
	show(del_btn, (transactions.selectedCount() > 0));

	deltrans.value = transactions.selectedArr.join();

	if (transactions.selectedCount() == 1)
	{
		if (firstElementChild(edit_btn) && firstElementChild(edit_btn).tagName.toLowerCase() == 'a')
			firstElementChild(edit_btn).href = baseURL + 'transactions/edit/' + transactions.selectedArr[0];
	}

	show('toolbar', (transactions.selectedCount() > 0));
	if (transactions.selectedCount() > 0)
	{
		onScroll();
	}
}


// Account select callback
function onAccountSel(obj)
{
	var accSel;
	var sArr = [], str = '';

	if (!obj)
		return;
	accSel = ge('acc_id');
	if (!accSel)
		return;

	for(acc_id in obj)
	{
		sArr.push(obj[acc_id]);
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

	trlist = ge('trlist');
	if (!trlist)
		return;

	var trListSortable = new Sortable({ oninsertat : onTransPosChanged,
									group : 'transactions',
									itemClass : 'trlist_item_wrap',
									placeholderClass : 'trlist_item_placeholder',
									copyWidth : true,
									table : detailsMode });

	listItem_wr = firstElementChild(trlist);
	listItem = null;
	while(listItem_wr)
	{
		if (detailsMode)
		{
			if (listItem_wr.className.indexOf('details_table') != -1)
				listItem_wr = firstElementChild(listItem_wr);

			if (listItem_wr.tagName && listItem_wr.tagName == 'TBODY')
			{
				listItem = firstElementChild(listItem_wr);		// get tr element
				trans_id = (listItem.id.length > 3) ? parseInt(listItem.id.substr(3)) : 0;		// cut leading 'tr_' from identifier
				if (trans_id)
				{
					listItem.onclick = onTransClick.bind(null, trans_id);
					firstElementChild(listItem).style.cursor = 'pointer';
				}

				trListSortable.add(listItem_wr);
			}
		}
		else
		{
			if (!detailsMode && listItem_wr.className.indexOf('trlist_item_wrap') != -1)
			{
				listItem = firstElementChild(listItem_wr);
				trans_id = (listItem.id.length > 3) ? parseInt(listItem.id.substr(3)) : 0;		// cut leading 'tr_' from identifier
				if (trans_id)
				{
					listItem.onclick = onTransClick.bind(null, trans_id);
					firstElementChild(listItem).style.cursor = 'pointer';
				}

				trListSortable.add(listItem_wr);
			}
		}

		listItem_wr = nextElementSibling(listItem_wr);
	}
}


// Sent AJAX request to server to change position of transaction
function sendChangePosRequest(trans_id, newPos)
{
	var params = { 'id' : trans_id, 'pos' : newPos };

	postData(baseURL + 'api/transaction.php?act=setpos', urlJoin(params), onChangePosCallback(trans_id, newPos));
}


// Return callback function for position change request
function onChangePosCallback(trans_id, newPos)
{
	return function(result)
	{
		if (result && result == 'ok')
		{
			updateTransArrPos(trans_id, newPos);
		}
		else
		{
			cancelPosChange();
		}
	}
}


// Update local transactions array on successfull result from server
function updateTransArrPos(trans_id, newPos)
{
	transactions.setPos(trans_id, newPos);
}


// Cancel local changes on transaction position update fail
function cancelPosChange()
{
}


// Return transaction id from transaction item element
function transIdFromElem(elem)
{
	return (elem && elem.id.length > 3) ? parseInt(elem.id.substr(3)) : 0;
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
		newPos = replacedItem[8];
		sendChangePosRequest(tr_id, newPos);
	}
}


// Account change event handler
function onAccountChange(obj)
{
	var acc_id;
	var newLocation;
	var reloadNeeded = false;
	var accArr = [], str = '';

	// Check all accounts from the new selection present in current selection
	for(acc_id in obj)
	{
		if (curAccId.indexOf(acc_id) == -1)
		{
			reloadNeeded = true;
			break;
		}
	}

	// Check all currenlty selected accounts present in the new selection
	if (!reloadNeeded)
	{
		if (curAccId.some(function(acc_id){ return !(acc_id in obj); }))
			reloadNeeded = true;
	}

	if (!reloadNeeded)
		return;

	// Prepare parameters
	for(acc_id in obj)
	{
		accArr.push(acc_id);
	}

	str = accArr.join(',');

	newLocation = baseURL + 'transactions/?type=' + transType;
	if (str != '')
		newLocation += '&acc_id=' + str;
	if (searchRequest)
		newLocation += '&search=' + encodeURI(searchRequest);
	if (detailsMode)
		newLocation += '&mode=details';

	window.location = newLocation;
}


// Transaction search form submit event handler
function onSearchSubmit(frm)
{
	if (!frm)
		return false;

	frm.action = baseURL + 'transactions/?type=' + transType;
	if (curAccId != 0)
		frm.action += '&acc_id=' + curAccId;
	if (detailsMode)
		frm.action += '&mode=details';

	return true;
}


var singleTransDeleteTitle = 'Delete transaction';
var multiTransDeleteTitle = 'Delete transactions';
var multiTransDeleteMsg = 'Are you sure want to delete selected transactions?<br>Changes in the balance of affected accounts will be canceled.';
var singleTransDeleteMsg = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';


// Delete popup callback
function onDeletePopup(res)
{
	var delform;

	if (!dwPopup)
		return;

	dwPopup.close();
	dwPopup = null;

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
	if (transactions.selectedCount() == 0)
		return;

	// check popup already created
	if (dwPopup)
		return;

	dwPopup = new Popup();
	if (!dwPopup)
		return;

	if (!dwPopup.create({ id : 'delete_warning',
						title : (transactions.selectedCount() > 1) ? multiTransDeleteTitle : singleTransDeleteTitle,
						msg : (transactions.selectedCount() > 1) ? multiTransDeleteMsg : singleTransDeleteMsg,
						btn : { okBtn : { onclick : onDeletePopup.bind(null, true) },
						cancelBtn : { onclick : onDeletePopup.bind(null, false) } }
						}))
	{
		dwPopup = null;
		return;
	}

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
	var newLocation;

	if (!selRange)
		return;

	newLocation = baseURL + 'transactions/?type=' + transType;
	if (acc_id != 0)
		newLocation += '&acc_id=' + curAccId;
	if (searchRequest)
		newLocation += '&search=' + encodeURI(searchRequest);
	if (detailsMode)
		newLocation += '&mode=details';
	newLocation += '&stdate=' + Calendar.format(selRange.start) + '&enddate=' + Calendar.format(selRange.end);

	window.location = newLocation;
}


// Show calendar block
function showCalendar()
{
	if (!calendarObj)
	{
		calendarObj = Calendar.create({ wrapper_id : 'calendar',
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
