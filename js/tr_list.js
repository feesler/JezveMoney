﻿var dwPopup;
var calendarObj = null;
var startDate = null, endDate = null;


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
			transArr.forEach(function(trans)
			{
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
			});
		}

		return true;
	}
};



// Account change event handler
function onAccountChange()
{
	var acc_id, accsel;
	var newLocation;

	accsel = ge('accsel');
	if (!accsel)
		return;

	acc_id = parseInt(selectedValue(accsel));

	if (curAccId == acc_id)
		return;

	newLocation = './transactions.php?type=' + transType;
	if (acc_id != 0)
		newLocation += '&acc_id=' + acc_id;

	window.location = newLocation;
}


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

		transObj.className = 'trlist_item';
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
		if (edit_btn.firstElementChild && edit_btn.firstElementChild.tagName.toLowerCase() == 'a')
			edit_btn.firstElementChild.href = './edittransaction.php?id=' + transactions.selectedArr[0];
	}
}


// Initialization of drap and drop features
function initTransListDrag()
{
	var trlist, listItem_wr, listItem, trans_id;

	trlist = ge('trlist');
	if (!trlist)
		return;

	listItem_wr = trlist.firstElementChild;
	listItem = null;
	while(listItem_wr)
	{
		if (detailsMode)
		{
			if (listItem_wr.className.indexOf('details_table') != -1)
				listItem_wr = listItem_wr.firstElementChild;

			if (listItem_wr.tagName && listItem_wr.tagName == 'TBODY')
			{
				listItem = listItem_wr.firstElementChild;		// get tr element
				trans_id = (listItem.id.length > 3) ? parseInt(listItem.id.substr(3)) : 0;		// cut leading 'tr_' from identifier
				if (trans_id)
				{
					listItem.onclick = bind(onTransClick, null, trans_id);
					listItem.firstElementChild.style.cursor = 'pointer';
				}

				new DropTarget(listItem_wr);
				new DragObject(listItem, true);
			}
		}
		else
		{
			if (!detailsMode && listItem_wr.className.indexOf('trlist_item_wrap') != -1)
			{
				listItem = listItem_wr.firstElementChild;
				trans_id = (listItem.id.length > 3) ? parseInt(listItem.id.substr(3)) : 0;		// cut leading 'tr_' from identifier
				if (trans_id)
				{
					listItem.onclick = bind(onTransClick, null, trans_id);
					listItem.firstElementChild.style.cursor = 'pointer';
				}

				new DropTarget(listItem_wr);
				new DragObject(listItem);
			}
		}

		listItem_wr = listItem_wr.nextElementSibling;
	}
}


// Sent AJAX request to server to change position of transaction
function sendChangePosRequest(trans_id, newPos)
{
	getData('./modules/setpos.php?id=' + trans_id + '&pos=' + newPos, onChangePosCallback(trans_id, newPos));
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


// Transaction item drop callback
function onTransPosChanged(trans_id, retrans_id)
{
	var replacedItem, newPos;

	replacedItem = transactions.findById(retrans_id);

	if (replacedItem)
	{
		newPos = replacedItem[8];
		sendChangePosRequest(trans_id, newPos);
	}
}


// Account change event handler
function onAccountChange()
{
	var acc_id, accsel;
	var newLocation;

	accsel = ge('acc_id');
	if (!accsel)
		return;

	acc_id = parseInt(selectedValue(accsel));

	if (curAccId == acc_id)
		return;

	newLocation = './transactions.php?type=' + transType;
	if (acc_id != 0)
		newLocation += '&acc_id=' + acc_id;
	if (searchRequest)
		newLocation += '&search=' + encodeURI(searchRequest);

	window.location = newLocation;
}


// Transaction search form submit event handler
function onSearchSubmit(frm)
{
	if (!frm)
		return false;

	frm.action = './transactions.php?type=' + transType;
	if (curAccId != 0)
		newLocation += '&acc_id=' + curAccId;

	frm.action = './transactions.php';

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
						btn : { okBtn : { onclick : bind(onDeletePopup, null, true) },
						cancelBtn : { onclick : bind(onDeletePopup, null, false) } }
						}))
	{
		dwPopup = null;
		return;
	}

	dwPopup.show();
}


// Create calendar object
function buildCalendar(callback)
{
	var today = new Date();

	return createCalendar(today.getDate(), today.getMonth(), today.getFullYear(), callback);
}


// Hide calendar block
function hideCalendar()
{
	show('calendar', false);
}


// Start date select callback
function onSelectStartDate(date, month, year)
{
	var datefield;

	datefield = ge('date');
	if (!datefield)
		return;

	startDate = new Date(year, month, date);

	if (startDate && endDate)
	{
		hideCalendar();
		datefield.value = formatDate(startDate) + ' - ' + formatDate(endDate);

		newLocation = './transactions.php?type=' + transType;
		if (acc_id != 0)
			newLocation += '&acc_id=' + curAccId;
		if (searchRequest)
			newLocation += '&search=' + encodeURI(searchRequest);
		newLocation += '&stdate=' + formatDate(startDate) + '&enddate=' + formatDate(endDate);

		window.location = newLocation;
	}
}


// End date select callback
function onSelectEndDate(date, month, year)
{
	var datefield;

	datefield = ge('date');
	if (!datefield)
		return;

	endDate = new Date(year, month, date);

	if (startDate && endDate)
	{
		hideCalendar();
		datefield.value = formatDate(startDate) + ' - ' + formatDate(endDate);

		newLocation = './transactions.php?type=' + transType;
		if (acc_id != 0)
			newLocation += '&acc_id=' + curAccId;
		if (searchRequest)
			newLocation += '&search=' + encodeURI(searchRequest);
		newLocation += '&stdate=' + formatDate(startDate) + '&enddate=' + formatDate(endDate);

		window.location = newLocation;
	}
}


// Show calendar block
function showCalendar()
{
	if (!calendarObj)
	{
		calendarObj = ge('calendar');
		if (!calendarObj)
			return;

		var cal1, cal2;

		cal1 = ce('div', {}, [ buildCalendar(onSelectStartDate) ]);
		cal2 = ce('div', {}, [ buildCalendar(onSelectEndDate) ]);

		calendarObj.appendChild(cal1);
		calendarObj.appendChild(cal2);
	}

	show(calendarObj, !isVisible(calendarObj));
	show('calendar_btn', false);
	show('date_block', true);

	setEmptyClick(hideCalendar, ['calendar', 'calendar_btn', 'cal_rbtn']);
}
