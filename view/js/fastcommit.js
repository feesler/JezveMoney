var trRows = [];
var trListSortable = null;
var mainAccObj = null;

function accFromSelect(selectObj)
{
	return idSearch(accounts, parseInt(selectedValue(selectObj)));
}


function currFromSelect(selectObj)
{
	return idSearch(currencies, parseInt(selectedValue(selectObj)));
}


function updMainAccObj()
{
	mainAccObj = accFromSelect(ge('acc_id'));
}


function updateRowsPos()
{
	trRows.forEach(function(rowObj, ind)
	{
		rowObj.pos = ind;
	});
}


function delRow(rowObj)
{
	var delPos;

	if (!rowObj)
		return;
	re(rowObj.rowEl);

	delPos = rowObj.pos;

	trRows.splice(delPos, 1);
	updateRowsPos();
}

function createRow()
{
	var rowsContainer;
	var rowObj = {};

	rowsContainer = ge('rowsContainer');
	if (!rowsContainer)
		return;

	updMainAccObj();
	if (!mainAccObj)
		return;

	rowObj.currIdInp = ce('input', { type : 'hidden', name : 'curr_id[]', value : mainAccObj.curr_id });
	rowObj.currSel = ce('select');
	currencies.forEach(function(currency)
	{
		var option = ce('option', { value : currency.id, innerHTML : currency.name,
									selected : (currency.id == mainAccObj.id) });

		rowObj.currSel.appendChild(option);
	});
	rowObj.currSel.onchange = onCurrChange.bind(rowObj.currSel, rowObj);

	rowObj.trTypeSel = ce('select', { name : 'tr_type[]' },
			[ ce('option', { value : 'expense', innerHTML : '-' }),
				ce('option', { value : 'income', innerHTML : '+' }),
				ce('option', { value : 'transferfrom', innerHTML : '>' }),
				ce('option', { value : 'transferto', innerHTML : '<' })	]);
	rowObj.trTypeSel.onchange = onTrTypeChange.bind(rowObj.trTypeSel, rowObj);

	rowObj.destAccIdInp = ce('input', { type : 'hidden', name : 'dest_acc_id[]', value : '' });

	rowObj.destAccSel = ce('select', { disabled : true },
								ce('option', { value : 0, innerHTML : 'Destination account', selected : true, disabled : true }));
	accounts.forEach(function(account)
	{
		var option = ce('option', { value : account.id, innerHTML : account.name });
		if (account.id == mainAccObj.id)
			enable(option, false);

		rowObj.destAccSel.appendChild(option);
	});
	rowObj.destAccSel.onchange = onDestChange.bind(rowObj.destAccSel, rowObj);

	rowObj.amountInp = ce('input', { type : 'text', name : 'amount[]', placeholder : 'Amount' });

	rowObj.destAmountInp = ce('input', { type : 'text', name : 'dest_amount[]',
											disabled : true, placeholder : 'Destination amount' });

	rowObj.dateInp = ce('input', { type : 'text', name : 'date[]', placeholder : 'Date' });
	rowObj.commInp = ce('input', { type : 'text', name : 'comment[]', placeholder : 'Comment' });
	rowObj.delBtn = ce('input', { className : 'btn ok_btn', type : 'button',
					onclick : delRow.bind(null, rowObj),
					value : '-' });

	rowObj.rowEl = ce('div', { className : 'tr_row clearfix' },
		[ rowObj.trTypeSel,
			rowObj.amountInp,
			rowObj.currIdInp,
			rowObj.currSel,
			rowObj.destAccIdInp,
			rowObj.destAccSel,
			rowObj.destAmountInp,
			rowObj.dateInp,
			rowObj.commInp,
			rowObj.delBtn ]);

	rowsContainer.appendChild(rowObj.rowEl);

	if (trListSortable)
		trListSortable.add(rowObj.rowEl);

	rowObj.pos = trRows.length;

	trRows.push(rowObj);
}

// Disable account option if it's the same as main account
function syncAccountOption(opt)
{
	var optVal;

	if (!opt)
		return;

	optVal = parseInt(opt.value);

	if (optVal == 0 || optVal == mainAccObj.id)
	{
		opt.disabled = true;
		opt.selected = false;
	}
	else
	{
		opt.disabled = false;
	}
}


function syncDestAccountSelect(rowObj)
{
	var i, l;

	for(i = 0, l = rowObj.destAccSel.options.length; i < l; i++)
	{
		syncAccountOption(rowObj.destAccSel.options[i]);
	}
}


function syncDestAmountAvail(rowObj)
{
	if (rowObj.destAccSel.disabled === true)
	{
		var currObj = currFromSelect(rowObj.currSel);
		enable(rowObj.destAmountInp, currObj != null && mainAccObj.curr_id != currObj.id);
	}
	else
	{
		var destAccObj = accFromSelect(rowObj.destAccSel);
		enable(rowObj.destAmountInp, destAccObj != null && mainAccObj.curr_id != destAccObj.curr_id);
	}
}


function copyDestAcc(rowObj)
{
	if (!rowObj || !rowObj.destAccIdInp || !rowObj.destAccSel)
		return;

	rowObj.destAccIdInp.value = selectedValue(rowObj.destAccSel);
}


function onTrTypeChange(rowObj)
{
	var tr_type;

	if (!rowObj)
		return;

	tr_type = selectedValue(rowObj.trTypeSel);
	if (!rowObj.destAccSel || !rowObj.destAccSel.options)
		return;

	syncCurrAvail(rowObj);
	if (tr_type == 'transferfrom' || tr_type == 'transferto')
	{
		enable(rowObj.destAccSel, true);
		syncDestAccountSelect(rowObj);

		copyDestAcc(rowObj);
	}
	else
	{
		enable(rowObj.destAccSel, false);
	}

	syncDestAmountAvail(rowObj);
}


function syncCurrAvail(rowObj)
{
	var tr_type = selectedValue(rowObj.trTypeSel);
	if (tr_type == 'transferfrom' || tr_type == 'transferto')		// transfer expect currencies will be the same as source and destination account
	{
		enable(rowObj.currSel, false);
		selectByValue(rowObj.currSel, mainAccObj.curr_id);
		copyCurr(rowObj);
	}
	else
	{
		enable(rowObj.currSel, true);
	}
}


function copyCurr(rowObj)
{
	if (!rowObj || !rowObj.currIdInp || !rowObj.currSel)
		return;

	rowObj.currIdInp.value = selectedValue(rowObj.currSel);
}


function onCurrChange(rowObj)
{
	copyCurr(rowObj);

	syncDestAmountAvail(rowObj);
}


function onMainAccChange()
{
	updMainAccObj();
	if (!mainAccObj)
		return;

	trRows.forEach(function(rowObj)
	{
		tr_type = selectedValue(rowObj.trTypeSel);
		if (tr_type == 'transferfrom' || tr_type == 'transferto')
		{
			syncDestAccountSelect(rowObj);

			copyDestAcc(rowObj);
		}
		syncCurrAvail(rowObj);
		syncDestAmountAvail(rowObj);
	});
}


function onDestChange(rowObj)
{
	copyDestAcc(rowObj);
	syncDestAmountAvail(rowObj);
}


function onSubmitClick()
{
	var fastcommitfrm = ge('fastcommitfrm');
	if (!fastcommitfrm)
		return;

	trRows.forEach(function(rowObj)
	{
		rowObj.amountInp.value = fixFloat(rowObj.amountInp.value);
		rowObj.destAmountInp.value = fixFloat(rowObj.destAmountInp.value);

		enable(rowObj.destAccSel, true);
		enable(rowObj.destAmountInp, true);
	});

	fastcommitfrm.submit();
}


function getRowByElem(rowEl)
{
	var resObj = null;

	trRows.some(function(rowObj){
		var cond = (rowEl == rowObj.rowEl);
		if (cond)
			resObj = rowObj;
		return cond;
	});

	return resObj;
}


function onTransPosChanged(origRow, replacedRow)
{
	var origRowObj = getRowByElem(origRow);
	var replacedRowObj = getRowByElem(replacedRow);
	if (!origRowObj || !replacedRowObj)
		return;

	trRows.splice(replacedRowObj.pos, 0, trRows.splice(origRowObj.pos, 1)[0]);

	updateRowsPos();
}


function initPage()
{
	var submitbtn = ge('submitbtn');
	if (!submitbtn)
		return;

	submitbtn.onclick = onSubmitClick;

	createRow();

	trListSortable = new Sortable({ oninsertat : onTransPosChanged,
									container : 'rowsContainer',
									group : 'transactions',
									itemClass : 'tr_row',
									placeholderClass : 'tr_row_placeholder',
									copyWidth : true,
									onlyRootHandle : true });
}
