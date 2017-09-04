var curTrRows = 0;
var trListSortable = null;

function accFromSelect(selectObj)
{
	return idSearch(accounts, parseInt(selectedValue(selectObj)));
}


function getMainAccObj()
{
	return accFromSelect(ge('acc_id'));
}


function changeTrRowId(row_id, new_id)
{
	var rowEl, trTypeSel, delBtn, destAccSel, destAmountInp;

	if (row_id == new_id)
		return;

	rowEl = ge('tr_' + row_id);
	if (!rowEl)
		return;

	rowEl.id = 'tr_' + new_id;
	trTypeSel = firstElementChild(rowEl);
	if (trTypeSel)
	{
		trTypeSel.onchange = onTrTypeChange.bind(null, new_id);
	}
	destAccSel = ge('ds_' + row_id);
	if (destAccSel)
	{
		destAccSel.onchange = onDestChange.bind(destAccSel, new_id);
	}
	destAmountInp = ge('da_' + row_id);
	if (destAmountInp)
	{
		destAmountInp.id = 'da_' + new_id;
	}
	delBtn = ge('del_' + row_id);
	if (delBtn)
	{
		delBtn.id = 'del_' + new_id;
		delBtn.onclick = delRow.bind(null, new_id);
	}
}


function delRow(row_id)
{
	var rowEl;

	rowEl = ge('tr_' + row_id);
	if (!rowEl)
		return;
	re(rowEl);

	do
	{
		row_id++;
		rowEl = ge('tr_' + row_id);
		if (!rowEl)
			break;
		changeTrRowId(row_id, row_id - 1);
	}
	while(rowEl);

	curTrRows--;
}

function createRow()
{
	var rowsContainer, rowEl;
	var destAccSel, mainAcc;

	rowsContainer = ge('rowsContainer');
	if (!rowsContainer)
		return;

	mainAcc = getMainAccObj();
	if (!mainAcc)
		return;

	destAccSel = ce('select', { id : 'ds_' + (curTrRows + 1), disabled : true },
								ce('option', { value : 0, innerHTML : 'Destination account', selected : true, disabled : true }));
	accounts.forEach(function(account)
	{
		var option = ce('option', { value : account.id, innerHTML : account.name });
		if (account.id == mainAcc.id)
			enable(option, false);

		destAccSel.appendChild(option);
	});
	destAccSel.onchange = onDestChange.bind(destAccSel, curTrRows + 1);

	rowEl = ce('div', { id : 'tr_' + (curTrRows + 1), className : 'tr_row' },
		[ ce('select', { name : 'tr_type[]', onchange : onTrTypeChange.bind(null, curTrRows + 1) },
				[ ce('option', { value : 'expense', innerHTML : '-' }),
					ce('option', { value : 'income', innerHTML : '+' }),
					ce('option', { value : 'transfer', innerHTML : '>' })	]),
			ce('input', { type : 'hidden', name : 'dest_acc_id[]', value : '' }),
			destAccSel,
			ce('input', { type : 'text', name : 'amount[]', placeholder : 'Amount' }),
			ce('input', { id : 'da_' + (curTrRows + 1), type : 'text', name : 'dest_amount[]', disabled : true, placeholder : 'Destination amount' }),
			ce('input', { type : 'text', name : 'date[]', placeholder : 'Date' }),
			ce('input', { type : 'text', name : 'comment[]', placeholder : 'Comment' }),
			ce('input', { id : 'del_' + (curTrRows + 1), className : 'btn ok_btn', type : 'button',
							onclick : delRow.bind(null, curTrRows + 1),
							value : '-' })
				]);

	rowsContainer.appendChild(rowEl);
	curTrRows++;

	if (trListSortable)
		trListSortable.add(rowEl);
}

// Disable account option if it's the same as main account
function syncAccountOption(opt, acc_id)
{
	var optVal;

	if (!opt)
		return;

	optVal = parseInt(opt.value);

	if (optVal == 0 || optVal == acc_id)
	{
		opt.selected = false;
		opt.disabled = true;
	}
	else
	{
		opt.disabled = false;
	}
}


function copyDestAcc(destAccSel)
{
	var destAccIdInp;

	if (!destAccSel)
		return;

	destAccIdInp = previousElementSibling(destAccSel);
	if (destAccIdInp)
		destAccIdInp.value = selectedValue(destAccSel);
}


function onTrTypeChange(row_id)
{
	var rowEl, el;
	var mainAccObj, tr_type, destAccObj, i, l;

	rowEl = ge('tr_' + row_id);
	if (!rowEl)
		return;

	mainAccObj = getMainAccObj();
	if (!mainAccObj)
		return;

	el = firstElementChild(rowEl);
	if (!el)
		return;
	tr_type = selectedValue(el);
	destAccSel = ge('ds_' + row_id);
	if (!destAccSel || !destAccSel.options)
		return;

	if (tr_type == 'transfer')
	{
		enable(destAccSel, true);
		for(i = 0, l = destAccSel.options.length; i < l; i++)
		{
			syncAccountOption(destAccSel.options[i], mainAccObj.id);
		}

		copyDestAcc(destAccSel);

		destAccObj = accFromSelect(destAccSel);
		enable('da_' + row_id, destAccObj != null && mainAccObj.curr_id != destAccObj.curr_id);
	}
	else
	{
		enable(destAccSel, false);
	}
}


function onMainAccChange()
{
	var accObj, rowEl, trTypeSel, destAccSel, destAmountInp, destAccObj;
	var row_id;

	accObj = getMainAccObj();
	if (!accObj)
		return;

	row_id = 1;
	rowEl = ge('tr_' + row_id);
	while(rowEl)
	{
		trTypeSel = firstElementChild(rowEl);
		tr_type = selectedValue(trTypeSel);
		if (tr_type == 'transfer')
		{
			destAccSel = ge('ds_' + row_id);
			for(i = 0, l = destAccSel.options.length; i < l; i++)
			{
				syncAccountOption(destAccSel.options[i], accObj.id);
			}

			copyDestAcc(destAccSel);

			destAccObj = accFromSelect(destAccSel);
			destAmountInp = nextElementSibling(nextElementSibling(destAccSel));
			enable(destAmountInp, destAccObj != null && accObj.curr_id != destAccObj.curr_id);
		}

		row_id++;
		rowEl = nextElementSibling(rowEl);
	}
}


function onDestChange(row_id)
{
	var mainAccObj, destAccObj, destAmountInp;

	mainAccObj = getMainAccObj();
	if (!mainAccObj)
		return;

	copyDestAcc(this);

	destAccObj = accFromSelect(this);
	destAmountInp = ge('da_' + row_id);

	enable(destAmountInp, destAccObj != null && mainAccObj.curr_id != destAccObj.curr_id);
}


function onSubmit()
{
	var srcAmount, destAmount;

	for(i = 1; i <= curTrRows; i++)
	{
		destAmount = ge('da_' + i);
		srcAmount = previousElementSibling(destAmount);
		srcAmount.value = fixFloat(srcAmount.value);
		destAmount.value = fixFloat(destAmount.value);

		enable('ds_' + i, true);
		enable(destAmount, true);
	}

	return true;
}


function onTransPosChanged(origRow, replacedRow)
{
	var row_id, rowEl, lastRow_id;
	var trans_id, retrans_id;
	var movingUp;

	trans_id = parseInt(origRow.id.substr(3));
	retrans_id = parseInt(replacedRow.id.substr(3));

	changeTrRowId(trans_id, curTrRows + 1);

	movingUp = (trans_id > retrans_id);
	if (movingUp)	// moving up
	{
		for(row_id = trans_id - 1; row_id >= retrans_id; row_id--)
		{
			changeTrRowId(row_id, row_id + 1);
		}
	}
	else						// moving down
	{
		for(row_id = trans_id + 1; row_id <= retrans_id; row_id++)
		{
			changeTrRowId(row_id, row_id - 1);
		}
	}

	changeTrRowId(curTrRows + 1, retrans_id);
}


function initPage()
{
	createRow();

	trListSortable = new Sortable({ oninsertat : onTransPosChanged,
									container : 'rowsContainer',
									group : 'transactions',
									itemClass : 'tr_row',
									placeholderClass : 'tr_row_placeholder',
									copyWidth : true,
									onlyRootHandle : true });
}
