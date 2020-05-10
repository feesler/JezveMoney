var chPosObj = null;

function onSubmitNewPos(tr_id)
{
	var trans_pos, posField;

	if (!chPosObj || !chPosObj.firstElementChild)
		return;

	posField = chPosObj.firstElementChild;
	if (posField.tagName.toLowerCase() != 'input' || !posField.value || posField.value == '' || !isNum(posField.value))
		return;

	trans_pos = parseInt(posField.value);

	sendChangePosRequest(tr_id, trans_pos);
}


// Sent AJAX request to server to change position of transaction
function sendChangePosRequest(trans_id, newPos)
{
	ajax.post({
		url : baseURL + 'api/transaction/setpos',
		data : JSON.stringify({ 'id' : trans_id, 'pos' : newPos }),
		headers : { 'Content-Type' : 'application/json' },
		callback : onChangePosCallback
	});
}


// Callback function for position change request
function onChangePosCallback(result)
{
	var resObj = JSON.parse(result);

	if (resObj && resObj.result == 'ok')
	{
		window.location.reload();
	}
}


function showChangePos(tr_id, curPos)
{
	var tr_cell;

	tr_cell = ge('tr_' + tr_id);
	if (!tr_cell)
		return;

	if (chPosObj != null)
	{
		chPosObj.parentNode.removeChild(chPosObj);
		chPosObj = null;
	}

	posObj = ce('div', { style : { display : 'inline-block', marginLeft : '5px' } },
						[ ce('input', { type : 'text', value : curPos, style : { width : '60px' } }),
						ce('input', { type : 'button', value : 'ok', onclick : onSubmitNewPos.bind(null, tr_id) })]);
	if (posObj)
	{
		tr_cell.appendChild(posObj);
		chPosObj = posObj;
	}
}



onReady(function()
{
	if (!transactions)
		return;

	var trCell, btn, trObj;
	for(var tr_id in transactions)
	{
		trCell = ge('tr_' + tr_id);
		if (!trCell)
			continue;

		btn = trCell.firstElementChild;
		if (!btn)
			continue;

		trObj = transactions[tr_id];

		btn.onclick = showChangePos.bind(null, tr_id, trObj.pos);
	}

});
