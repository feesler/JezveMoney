var impRows = [];
var trRows = [];
var trListSortable = null;
var mainAccObj = null;
var trcount = null;


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

	trcount.innerHTML = trRows.length;
}


// Remove all imported rows
function cleanImpRows()
{
	impRows = [];

	removeChilds(importRows);
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

	trcount.innerHTML = trRows.length;
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
		item = item.nextElementSibling;

		if (item && item.classList.contains(className))
			return item;
	}

	return null;
}


// Find last sigling of item with specified class
function findLastSiblingByClass(item, className)
{
	while(item)
	{
		item = item.previousElementSibling;

		if (item && item.classList.contains(className))
			return item;
	}

	return null;
}


// Find first placeholder in the list
function findPlaceholder()
{
	var item = ge('rowsContainer');
	if (!item || !item.firstElementChild)
		return null;

	item = item.firstElementChild;

	if (item.classList.contains('tr_row_placeholder'))
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

	var item = parent.firstElementChild;
	for(var i = 1; i < n; i++)
	{
		item = item.nextElementSibling;
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

	trcount.innerHTML = trRows.length;
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
	if (!Array.isArray(trRows))
		return;

	var reqObj = trRows.map(function(rowObj)
	{
		var trObj = {};

		var selType = selectedValue(rowObj.trTypeSel);
		var secondAcc = idSearch(accounts, parseInt(rowObj.destAccIdInp.value));
		var person = idSearch(persons, parseInt(rowObj.personIdInp.value));
		var amountVal = fixFloat(rowObj.amountInp.value);
		var secondAmountVal = fixFloat(rowObj.destAmountInp.value);
		var selectedCurr = parseInt(rowObj.currIdInp.value);

		if (selType == 'expense')
		{
			trObj.type = EXPENSE;
			trObj.src_id = mainAccObj.id;
			trObj.dest_id = 0;
			trObj.src_curr = mainAccObj.curr_id;
			trObj.dest_curr = selectedCurr;
			trObj.src_amount = amountVal;
			trObj.dest_amount = (trObj.src_curr == trObj.dest_curr) ? amountVal : secondAmountVal;
		}
		else if (selType == 'income')
		{
			trObj.type = INCOME;
			trObj.src_id = 0;
			trObj.dest_id = mainAccObj.id;
			trObj.src_curr = selectedCurr;
			trObj.dest_curr = mainAccObj.curr_id;
			trObj.src_amount = (trObj.src_curr == trObj.dest_curr) ? amountVal : secondAmountVal;
			trObj.dest_amount = amountVal;

		}
		else if (selType == 'transferfrom')
		{
			if (!secondAcc)
				throw new Error('Invalid transaction: Second account not set');

			trObj.type = TRANSFER;
			trObj.src_id = mainAccObj.id;
			trObj.dest_id = secondAcc.id;
			trObj.src_curr = mainAccObj.curr_id;
			trObj.dest_curr = secondAcc.curr_id;
			trObj.src_amount = amountVal;
			trObj.dest_amount = (trObj.src_curr == trObj.dest_curr) ? amountVal : secondAmountVal;

		}
		else if (selType == 'transferto')
		{
			if (!secondAcc)
				throw new Error('Invalid transaction: Second account not set');

			trObj.type = TRANSFER;
			trObj.src_id = secondAcc.id;
			trObj.dest_id = mainAccObj.id;
			trObj.src_curr = secondAcc.curr_id;
			trObj.dest_curr = mainAccObj.curr_id;
			trObj.src_amount = (trObj.src_curr == trObj.dest_curr) ? amountVal : secondAmountVal;
			trObj.dest_amount = amountVal;
		}
		else if (selType == 'debtfrom' || selType == 'debtto')
		{
			if (!person)
				throw new Error('Invalid transaction: Person not set');

			trObj.type = DEBT;
			trObj.op = (selType == 'debtfrom') ? 1 : 2;
			trObj.person_id = person.id;
			trObj.acc_id = mainAccObj.id;
			trObj.src_curr = mainAccObj.curr_id;
			trObj.dest_curr = mainAccObj.curr_id;
			trObj.src_amount = amountVal;
			trObj.dest_amount = amountVal;
		}

		trObj.date = rowObj.dateInp.value;
		trObj.comment = rowObj.commInp.value;

		return trObj;
	});

	ajax.post({
		url : baseURL + 'api/transaction/createMultiple/',
		data : JSON.stringify(reqObj),
		headers : { 'Content-Type' : 'application/json' },
		callback : onCommitResult
	});
}


function onCommitResult(response)
{
	var status = false;
	var message = 'Fail to import transactions';

	try
	{
		var respObj = JSON.parse(response);

		status = (respObj && respObj.result == 'ok');
		if (status)
		{
			message = 'All transactions have been successfully imported';
			cleanTrRows();
			cleanImpRows();
		}
		else if (respObj && respObj.msg)
		{
			message = respObj.msg;
		}
	}
	catch(e)
	{
		message = e.message;
	}

	createMessage(message, (status ? 'msg_success' : 'msg_error'));
}


function getRowByElem(rowEl)
{
	var resObj = null;

	trRows.some(function(rowObj)
	{
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

	if (!replacedRow.classList.contains('tr_row'))	// put transaction on placeholder
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

	if (!refItem)
		rowsContainer.appendChild(phElem);
	else
		insertAfter(phElem, refItem);
}


// Import data request callback
function importLoadCallback(response)
{
	var data, importRows, rowsContainer;

	if (!response)
		return;

	importRows = ge('importRows');
	rowsContainer = ge('rowsContainer');
	if (!importRows || !importRows.parentNode || !rowsContainer)
		return;

	importRows.parentNode.classList.add('column');
	rowsContainer.classList.add('column');

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

	var importAllBtn = ge('importAllBtn');
	if (importAllBtn)
		importAllBtn.disabled = false;
}


// Map import row to new transaction
function mapImportRow(impRowObj)
{
	var rowObj;
	var tr_type, accCurr, trCurr;

	if (!impRowObj || !impRowObj.data)
		return;


	accCurr = findCurrencyByName(impRowObj.data.accCurrVal);
	if (!accCurr)
	{
		alert('Unknown currency ' + impRowObj.data.accCurrVal);
		return;
	}

	trCurr = findCurrencyByName(impRowObj.data.trCurrVal);
	if (!trCurr)
	{
		alert('Unknown currency ' + impRowObj.data.trCurrVal);
		return;
	}

	if (accCurr.id != mainAccObj.curr_id)	// currency should be same as main account
	{
		alert('Currency must be the same as main account');
		return;
	}

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
	if (item.classList.contains('tr_row'))	// insert at filled transaction
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

	trcount.innerHTML = trRows.length;

	updateRowsPos();
}


function onImportAll()
{
	impRows.forEach(mapImportRow);
}


function Uploader(file, options, onSuccess, onFail, onProgress)
{
	// fileId is unique file identificator
	var fileId = file.name + '-' + file.size + '-' + +file.lastModifiedDate;

	var fileType = file.name.substr(file.name.lastIndexOf('.') + 1);

	// make integer from file id to send in header
	// only ASCII symbols is available in headers
	fileId = hashCode(fileId);

	var errorCount = 0;

	var MAX_ERROR_COUNT = 6;

	var startByte = 0;

	var xhrUpload;
	var xhrStatus;

	function upload()
	{
		console.log("upload: check status");
		xhrStatus = new XMLHttpRequest();

		xhrStatus.onload = xhrStatus.onerror = function()
		{
			if (this.status == 200) {
				startByte = +this.responseText || 0;
				console.log("upload: startByte=" + startByte);
				send();
				return;
			}

			// something wrong
			if (errorCount++ < MAX_ERROR_COUNT)
				setTimeout(upload, 1000 * errorCount);		// try again after 1 second
			else
				onError(this.statusText);

		};

		xhrStatus.open('GET', baseURL + 'fastcommit/uploadstatus', true);
		xhrStatus.setRequestHeader('X-File-Id', fileId);
		xhrStatus.setRequestHeader('X-File-Type', fileType);
		xhrStatus.send();
	}


	function send()
	{
		xhrUpload = new XMLHttpRequest();
		xhrUpload.onload = xhrUpload.onerror = function()
		{
			console.log("upload end status:" + this.status + " text:" + this.statusText);

			if (this.status == 200)
			{
				onSuccess(this.response);
				return;
			}

			if (errorCount++ < MAX_ERROR_COUNT)
				setTimeout(resume, 1000 * errorCount);	// try again
			else
				onError(this.statusText);
		};

		xhrUpload.open('POST', baseURL + 'fastcommit/upload', true);
		// which file upload
		xhrUpload.setRequestHeader('X-File-Id', fileId);
		xhrUpload.setRequestHeader('X-File-Type', fileType);
		xhrUpload.setRequestHeader('X-File-Stat-Type', options.statType);
		if (options.encode)
			xhrUpload.setRequestHeader('X-File-Encode', 1);

		xhrUpload.upload.onprogress = function(e)
		{
			errorCount = 0;
			onProgress(startByte + e.loaded, startByte + e.total);
		}

		// send from startByte
		xhrUpload.send(file.slice(startByte));
	}


	function pause()
	{
		xhrStatus && xhrStatus.abort();
		xhrUpload && xhrUpload.abort();
	}


	this.upload = upload;
	this.pause = pause;
}


// obtain 32-bit integer from string
function hashCode(str)
{
	if (str.length == 0)
		return 0;

	var hash = 0,
	i, chr, len;

	for (i = 0; i < str.length; i++)
	{
		chr = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}

	return Math.abs(hash);
}


function onImportSuccess(response)
{
	importLoadCallback(response);
}


function onImportError()
{
	console.log('error');
}


function onImportProgress(loaded, total)
{
	console.log("progress " + loaded + ' / ' + total);
}


function onFileImport()
{
	var fileUploadRadio = ge('fileUploadRadio');
	var statTypeSel = ge('statTypeSel');
	var statType = statTypeSel.value;
	var isEncodeCheck = ge('isEncodeCheck');
	var encode = isEncodeCheck.checked;

	if (fileUploadRadio.checked)
	{
		var el = ge('fileInp')
		if (!el)
			return false;

		var file = el.files[0];
		if (!file)
			return false;

		uploader = new Uploader(file,
								{ statType : statType, encode : encode },
								onImportSuccess,
								onImportError,
								onImportProgress);
		uploader.upload();
	}
	else
	{
		var el;
		var reqObj = {};

		el = ge('srvFilePath');
		if (!el)
			return false;

		reqObj.fileName = el.value;
		reqObj.statType = statType;
		reqObj.encode = (encode ? 1 : 0);

		ajax.post({
			url : baseURL + 'fastcommit/upload/',
			data : urlJoin(reqObj),
			callback : onImportSuccess
		});
	}

	return false;
}


function initPage()
{
	var newRowBtn = ge('newRowBtn');
	var newPhBtn = ge('newPhBtn');
	var submitbtn = ge('submitbtn');
	var fileimportfrm = ge('fileimportfrm');
	var importAllBtn = ge('importAllBtn');
	trcount = ge('trcount');
	var acc_id = ge('acc_id');
	if (!newRowBtn || !newPhBtn || !fileimportfrm || !importAllBtn || !submitbtn || !trcount || !acc_id)
		return;

	newRowBtn.onclick = createRow;
	newPhBtn.onclick = addPlaceholder.bind(null, null);

	acc_id.onchange = onMainAccChange;

	importAllBtn.onclick = onImportAll;
	submitbtn.onclick = onSubmitClick;

	createRow();

	trListSortable = new Sortable({ oninsertat : onTransPosChanged,
									container : 'rowsContainer',
									group : 'transactions',
									selector : '.tr_row',
									placeholderClass : 'tr_row_placeholder',
									copyWidth : true,
									onlyRootHandle : true });

	fileimportfrm.onsubmit = onFileImport;
}
