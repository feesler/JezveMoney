var impRows = [];
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


function findCurrencyByName(currName)
{
	var res = null;

	currencies.some(function(currency)
	{
		var cond = (currency.name == currName);

		if (cond)
			res = currency;

		return cond;
	});

	return res;
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


// Remove all transaction rows
function cleanTrRows()
{
	trRows = [];

	removeChilds(rowsContainer);
}


function delRow(rowObj)
{
	var delPos;

	if (!rowObj)
		return;

	if (impRows.length)
		addPlaceholder(rowObj.rowEl);
	re(rowObj.rowEl);

	delPos = rowObj.pos;

	trRows.splice(delPos, 1);
	updateRowsPos();
}


function createRowObject()
{
	var rowObj = {};

	rowObj.currIdInp = ce('input', { type : 'hidden', name : 'curr_id[]', value : mainAccObj.curr_id });
	rowObj.currSel = ce('select');
	currencies.forEach(function(currency)
	{
		var option = ce('option', { value : currency.id, innerHTML : currency.name,
									selected : (currency.id == mainAccObj.curr_id) });

		rowObj.currSel.appendChild(option);
	});
	rowObj.currSel.onchange = onCurrChange.bind(rowObj.currSel, rowObj);

	rowObj.trTypeSel = ce('select', { name : 'tr_type[]' },
			[ ce('option', { value : 'expense', innerHTML : '-' }),
				ce('option', { value : 'income', innerHTML : '+' }),
				ce('option', { value : 'transferfrom', innerHTML : '>' }),
				ce('option', { value : 'transferto', innerHTML : '<' }),
				ce('option', { value : 'debtfrom', innerHTML : 'D>' }),
				ce('option', { value : 'debtto', innerHTML : 'D<' }) ]);
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

// Persons
	rowObj.personIdInp = ce('input', { type : 'hidden', name : 'person_id[]', value : '' });

	rowObj.personSel = ce('select');
	persons.forEach(function(person)
	{
		var option = ce('option', { value : person.id, innerHTML : person.name });

		rowObj.personSel.appendChild(option);
	});
	show(rowObj.personSel, false);
	rowObj.personSel.onchange = onPersonChange.bind(rowObj.personSel, rowObj);


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
			rowObj.personIdInp,
			rowObj.personSel,
			rowObj.destAmountInp,
			rowObj.dateInp,
			rowObj.commInp,
			rowObj.delBtn ]);

	return rowObj;
}


// Find first sibling of item with specified class
function findFirstSiblingByClass(item, className)
{
	while(item)
	{
		item = nextElementSibling(item);

		if (hasClass(item, className))
			return item;
	}

	return null;
}


// Find last sigling of item with specified class
function findLastSiblingByClass(item, className)
{
	while(item)
	{
		item = previousElementSibling(item);

		if (hasClass(item, className))
			return item;
	}

	return null;
}


// Find first placeholder in the list
function findPlaceholder()
{
	var item = firstElementChild(ge('rowsContainer'));

	if (hasClass(item, 'tr_row_placeholder'))
		return item;
	else
		return findFirstSiblingByClass(item, 'tr_row_placeholder');
}


// Find first transaction item after specified
function findNextItem(item)
{
	return findFirstSiblingByClass(item, 'tr_row');
}


// Find first transaction item before specified
function findPrevItem(item)
{
	return findLastSiblingByClass(item, 'tr_row');
}



// Return nth child of element if exist
function findNthItem(parent, n)
{
	if (!parent || !n)
		return null;

	var item = firstElementChild(parent);
	for(var i = 1; i < n; i++)
	{
		item = nextElementSibling(item);
		if (!item)
			return null;
	}

	return item;
}


// Add new transaction row and insert it into list
function createRow()
{
	var rowsContainer;
	var rowObj;

	rowsContainer = ge('rowsContainer');
	if (!rowsContainer)
		return;

	updMainAccObj();
	if (!mainAccObj)
		return;

	rowObj = createRowObject();

	var nextTrRow = null;
	var firstPlaceholder = findPlaceholder();

	if (firstPlaceholder)
	{
		nextTrRow = findNextItem(firstPlaceholder);

		insertAfter(rowObj.rowEl, firstPlaceholder);
		if (nextTrRow)
		{
			var nextTrRowObj = getRowByElem(nextTrRow);

			trRows.splice(nextTrRowObj.pos, 0, rowObj);

			updateRowsPos();
		}
		else
		{
			rowObj.pos = trRows.length;
			trRows.push(rowObj);
		}

		re(firstPlaceholder);
	}
	else
	{
		rowsContainer.appendChild(rowObj.rowEl);

		rowObj.pos = trRows.length;

		trRows.push(rowObj);
	}
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
	var tr_type = selectedValue(rowObj.trTypeSel);
	if (tr_type == 'expense' || tr_type == 'income')
	{
		var currObj = currFromSelect(rowObj.currSel);
		enable(rowObj.destAmountInp, currObj != null && mainAccObj.curr_id != currObj.id);
	}
	else if (tr_type == 'transferfrom' || tr_type == 'transferto')
	{
		var destAccObj = accFromSelect(rowObj.destAccSel);
		enable(rowObj.destAmountInp, destAccObj != null && mainAccObj.curr_id != destAccObj.curr_id);
	}
	else	// debt
	{
		enable(rowObj.destAmountInp, false);
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
		show(rowObj.personSel, false);
		show(rowObj.destAccSel, true);
		enable(rowObj.destAccSel, true);
		syncDestAccountSelect(rowObj);

		copyDestAcc(rowObj);
	}
	else if (tr_type == 'debtfrom' || tr_type == 'debtto')
	{
		copyPerson(rowObj);
		show(rowObj.personSel, true);
		show(rowObj.destAccSel, false);
		enable(rowObj.destAccSel, false);
	}
	else
	{
		show(rowObj.personSel, false);
		show(rowObj.destAccSel, true);
		enable(rowObj.destAccSel, false);
	}

	syncDestAmountAvail(rowObj);
}


function syncCurrAvail(rowObj)
{
	var tr_type = selectedValue(rowObj.trTypeSel);
	if (tr_type == 'transferfrom' || tr_type == 'transferto' ||		// transfer expect currencies will be the same as source and destination account
		tr_type == 'debtfrom' || tr_type == 'debtto')				// debt curently expect only the same currency as account
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


function copyPerson(rowObj)
{
	if (!rowObj || !rowObj.personIdInp || !rowObj.personSel)
		return;

	rowObj.personIdInp.value = selectedValue(rowObj.personSel);
}


function onPersonChange(rowObj)
{
	copyPerson(rowObj);
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
	if (trRows.length < 2)
		return;

	var origRowObj = getRowByElem(origRow);
	if (!origRowObj)
		return;

	if (!replacedRow)
		return;

	if (!hasClass(replacedRow, 'tr_row'))	// put transaction on placeholder
	{
		var prevItemObj = getRowByElem(findPrevItem(origRow));
		var nextItemObj = getRowByElem(findNextItem(origRow));

		if (!prevItemObj)	// insert at the beginning of list
			trRows.splice(0, 0, trRows.splice(origRowObj.pos, 1)[0]);
		else if (prevItemObj && prevItemObj.pos > origRowObj.pos)
			trRows.splice(prevItemObj.pos, 0, trRows.splice(origRowObj.pos, 1)[0]);
		else if (nextItemObj && nextItemObj.pos < origRowObj.pos)
			trRows.splice(nextItemObj.pos, 0, trRows.splice(origRowObj.pos, 1)[0]);
		else		// nothing changed
			return;
	}
	else
	{
		var replacedRowObj = getRowByElem(replacedRow);
		if (!replacedRowObj)
			return;
		trRows.splice(replacedRowObj.pos, 0, trRows.splice(origRowObj.pos, 1)[0]);
	}

	updateRowsPos();
}


function addPlaceholder(refItem)
{
	var rowsContainer;
	var phElem;

	rowsContainer = ge('rowsContainer');
	if (!rowsContainer)
		return;

	phElem = ce('div', { className : 'tr_row_placeholder' });

	if (refItem === undefined)
		rowsContainer.appendChild(phElem);
	else
		insertAfter(phElem, refItem);
}


// Import button click handler
function onImportClick()
{
	ajax.get(baseURL + 'xlsimport.php', importLoadCallback);
}


// Import data request callback
function importLoadCallback(response)
{
	var data, importRows, rowsContainer;

	if (!response)
		return;

	importRows = ge('importRows');
	rowsContainer = ge('rowsContainer');
	if (!importRows || !rowsContainer)
		return;

	addClass(importRows.parentNode, 'column');
	addClass(rowsContainer, 'column');

	data = JSON.parse(response);
	if (!isArray(data))
		return;

	cleanTrRows();

	data.forEach(function(dataObj)
	{
		var impRowObj = {};

		impRowObj.data = dataObj;

		impRowObj.mapBtn = ce('input', { className : 'btn ok_btn', type : 'button',
						onclick : mapImportRow.bind(null, impRowObj),
						value : '->' });

		impRowObj.rowEl = ce('tr', { className : 'improw' }, [ ce('td', { innerHTML : dataObj.date }),
									ce('td', { innerHTML : dataObj.trAmountVal }),
									ce('td', { innerHTML : dataObj.trCurrVal }),
									ce('td', { innerHTML : dataObj.accAmountVal }),
									ce('td', { innerHTML : dataObj.accCurrVal }),
									ce('td', {},
										ce('div', { className : 'ellipsis_cell' },
											ce('div', { title : dataObj.descr },
												ce('span', { innerHTML : dataObj.descr })))),
									ce('td', {}, impRowObj.mapBtn)
	 								]);

		importRows.appendChild(impRowObj.rowEl);

		impRowObj.pos = impRows.length;

		impRows.push(impRowObj);

		addPlaceholder();
	});
}


// Map import row to new transaction
function mapImportRow(impRowObj)
{
	var rowObj;
	var tr_type, accCurr, trCurr;

	if (!impRowObj || !impRowObj.data)
		return;


	accCurr = findCurrencyByName(impRowObj.data.accCurrVal);
	trCurr = findCurrencyByName(impRowObj.data.trCurrVal);
	if (!accCurr || !trCurr)	// unknown currency
		return;

	if (accCurr.id != mainAccObj.curr_id)	// currency should be same as main account
		return;

	rowObj = createRowObject();

	if (impRowObj.data.accAmountVal > 0)
		tr_type = 'income';
	else
		tr_type = 'expense';

	selectByValue(rowObj.trTypeSel, tr_type);
	rowObj.trTypeSel.onchange(rowObj);

	rowObj.amountInp.value = Math.abs(impRowObj.data.accAmountVal);

	if (trCurr.id != accCurr.id)
	{
		selectByValue(rowObj.currSel, trCurr.id);
		rowObj.currSel.onchange(rowObj);
		rowObj.destAmountInp.value = Math.abs(impRowObj.data.trAmountVal);
	}

	rowObj.dateInp.value = impRowObj.data.date;
	rowObj.commInp.value = impRowObj.data.descr;

	if (window.convertHint !== undefined && isFunction(window.convertHint))
		convertHint(impRowObj.data, rowObj);

	var item = findNthItem(ge('rowsContainer'), impRowObj.pos + 1);
	if (!item)
		return;

	var replacedRow, replacedRowObj;
	if (hasClass(item, 'tr_row'))	// insert at filled transaction
	{
		replacedRow = getRowByElem(item);

		trRows[replacedRow.pos] = rowObj;
	}
	else if (!trRows.length)	// insert at empty list
	{
		trRows.push(rowObj);
	}
	else	// insert at placeholder
	{
		replacedRow = findNextItem(item);
		if (replacedRow)
		{
			replacedRowObj = getRowByElem(replacedRow);
			if (!replacedRowObj)
				return;
			trRows.splice(replacedRowObj.pos - 1, 0, rowObj);
		}
		else
		{
			replacedRow = findPrevItem(item);
			replacedRowObj = getRowByElem(replacedRow);
			if (!replacedRowObj)
				return;
			trRows.splice(replacedRowObj.pos, 0, rowObj);
		}
	}

	insertAfter(rowObj.rowEl, item);
	re(item);

	updateRowsPos();
}


function initPage()
{
	var importbtn = ge('importbtn');
	var submitbtn = ge('submitbtn');
	if (!importbtn || !submitbtn)
		return;

	importbtn.onclick = onImportClick;
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
