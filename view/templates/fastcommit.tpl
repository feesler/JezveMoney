<?php	include("./view/templates/commonhdr.tpl");	?>
<style>
.tr_row
{
	padding: 10px;
}

.tr_row > select,
.tr_row input
{
	display: inline;
	border: 1px solid #000;
	padding: 5px;
	width: 100px;
	margin: 0px 5px 0px 0px;
}
</style>
<script>
var accounts = <?=f_json_encode($accArr)?>;
var curTrRows = 0;

function accFromSelect(selectObj)
{
	return idSearch(accounts, parseInt(selectedValue(selectObj)));
}


function getMainAccObj()
{
	return accFromSelect(ge('acc_id'));
}


function delRow(row_id)
{
	var rowEl, delBtn, destAccSel, destAmountInp;

	rowEl = ge('tr_' + row_id);
	if (!rowEl)
		return;
	re(rowEl);

	do
	{
		row_id++;
		rowEl = 'tr_' + row_id;
		if (!rowEl)
			break;

		rowEl.id = rowEl('tr_' + (row_id - 1));
		trTypeSel = firstElementChild(rowEl);
		if (trTypeSel)
		{
			trTypeSel.onchange = onTrTypeChange.bind(null, row_id - 1);
		}
		destAccSel = ge('ds_' + row_id);
		if (destAccSel)
		{
			destAccSel.onchange = onDestChange.bind(null, row_id - 1);
		}
		destAmountInp = ge('da_' + row_id);
		if (destAmountInp)
		{
			destAmountInp.id = 'da_' + (row_id - 1);
		}
		delBtn = ge('del_' + row_id);
		if (delBtn)
		{
			delBtn.id = 'del_' + (row_id - 1);
			delBtn.onclick = delRow.bind(null, row_id - 1);
		}
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

	destAccSel = ce('select', { id : 'ds_' + (curTrRows + 1), name : 'dest_acc_id[]', disabled : true }, ce('option', { value : 0 }));
	accounts.forEach(function(account)
	{
		var option = ce('option', { value : account.id, innerHTML : account.name });
		if (account.id == mainAcc.id)
			enable(option, false);

		destAccSel.appendChild(option);
	});
	destAccSel.onchange = onDestChange.bind(null, curTrRows + 1);

	rowEl = ce('div', { id : 'tr_' + (curTrRows + 1), className : 'tr_row' },
		[ ce('select', { name : 'tr_type[]', onchange : onTrTypeChange.bind(null, curTrRows + 1) },
				[ ce('option', { value : 'expense', innerHTML : '-' }),
					ce('option', { value : 'income', innerHTML : '+' }),
					ce('option', { value : 'transfer', innerHTML : '>' })	]),
			destAccSel,
			ce('input', { type : 'text', name : 'amount[]', placeholder : 'Amount' }),
			ce('input', { id : 'da_' + (curTrRows + 1), type : 'text', name : 'dest_amount[]', disabled : true, placeholder : 'Destination amount' }),
			ce('input', { type : 'text', name : 'date[]', placeholder : 'Date' }),
			ce('input', { type : 'text', name : 'comment[]', placeholder : 'Comment' }),
			ce('input', { id : 'del_' + (curTrRows + 1), type : 'button',
							onclick : delRow.bind(null, curTrRows + 1),
							value : '-' })
				]);

	rowsContainer.appendChild(rowEl);
	curTrRows++;
}

// Disable account option if it's the same as main account
function syncAccountOption(opt, acc_id)
{
	if (!opt)
		return;

	if (parseInt(opt.value) == acc_id)
	{
		opt.selected = false;
		opt.disabled = true;
	}
	else
	{
		opt.disabled = false;
	}
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
	destAccSel = nextElementSibling(el);
	if (!destAccSel || !destAccSel.options)
		return;

	if (tr_type == 'transfer')
	{
		enable(destAccSel, true);
		for(i = 0, l = destAccSel.options.length; i < l; i++)
		{
			syncAccountOption(destAccSel.options[i], mainAccObj.id);
		}

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

	accObj = getMainAccObj();
	if (!accObj)
		return;

	rowEl = ge('tr_1');
	while(rowEl)
	{
		trTypeSel = firstElementChild(rowEl);
		tr_type = selectedValue(trTypeSel);
		if (tr_type == 'transfer')
		{
			destAccSel = nextElementSibling(trTypeSel);
			for(i = 0, l = destAccSel.options.length; i < l; i++)
			{
				syncAccountOption(destAccSel.options[i], accObj.id);
			}

			destAccObj = accFromSelect(destAccSel);
			destAmountInp = nextElementSibling(nextElementSibling(destAccSel));
			enable(destAmountInp, destAccObj != null && accObj.curr_id != destAccObj.curr_id);
		}

		rowEl = nextElementSibling(rowEl);
	}
}


function onDestChange(row_id)
{
	var mainAccObj, destAccObj, destAmountInp;

	mainAccObj = getMainAccObj();
	if (!mainAccObj)
		return;

	destAccObj = accFromSelect(ge('ds_' + row_id));
	destAmountInp = ge('da_' + row_id);

	enable(destAmountInp, destAccObj != null && mainAccObj.curr_id != destAccObj.curr_id);
}


function onSubmit()
{
	for(i = 1; i < curTrRows; i++)
	{
		enable('ds_' + i, true);
		enable('da_' + i, true);
	}

	return true;
}

onReady(function()
{
	createRow();
});
</script>
</head>
<body>
<form method="post" action="fastcommit.php" onsubmit="onSubmit()">
	<select id="acc_id" name="acc_id" onchange="onMainAccChange()">
<?php foreach($accArr as $accObj) {	?>
		<option value="<?=$accObj->id?>"><?=$accObj->name?></option>
<?php }	?>
	</select>
	<div id="rowsContainer"></div>
	<div>
		<input type="button" onclick="createRow()" value="+">
	</div>
	<div>
		<input type="submit" value="Commit">
	</div>
</form>
</body>
</html>
