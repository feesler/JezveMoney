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

function getMainAccId()
{
	return parseInt(selectedValue(ge('acc_id')));
}


function delRow(row_id)
{
	var rowEl, delBtn;

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
	var destAccSel, acc_id;

	rowsContainer = ge('rowsContainer');
	if (!rowsContainer)
		return;

	acc_id = getMainAccId();

	destAccSel = ce('select', { name : 'dest_acc_id[]', disabled : true }, ce('option', { value : 0 }));
	accounts.forEach(function(account)
	{
		var option = ce('option', { value : account.id, innerHTML : account.name });
		if (account.id == acc_id)
			enable(option, false);

		destAccSel.appendChild(option);
	});

	rowEl = ce('div', { id : 'tr_' + (curTrRows + 1), className : 'tr_row' },
		[ ce('select', { name : 'tr_type[]', onchange : onTrTypeChange.bind(null, curTrRows + 1) },
				[ ce('option', { value : 'expense', innerHTML : '-' }),
					ce('option', { value : 'income', innerHTML : '+' }),
					ce('option', { value : 'transfer', innerHTML : '>' })	]),
			destAccSel,
			ce('input', { type : 'text', name : 'amount[]', placeholder : 'Amount' }),
			ce('input', { type : 'text', name : 'dest_amount[]', disabled : true, placeholder : 'Destination amount' }),
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
	var acc_id, tr_type, i, l;

	rowEl = ge('tr_' + row_id);
	if (!rowEl)
		return;

	acc_id = getMainAccId();
	if (acc_id == -1)
		return;

	el = firstElementChild(rowEl);
	if (!el)
		return;
	tr_type = selectedValue(el);
	el = nextElementSibling(el);
	if (!el || !el.options)
		return;

	if (tr_type == 'transfer')
	{
		enable(el, true);
		for(i = 0, l = el.options.length; i < l; i++)
		{
			syncAccountOption(el.options[i], acc_id);
		}
	}
	else
	{
		enable(el, false);
	}
}


function onMainAccChange()
{
	var acc_id, rowEl, trTypeSel, destAccSel;

	acc_id = getMainAccId();
	if (acc_id == -1)
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
				syncAccountOption(destAccSel.options[i], acc_id);
			}
		}

		rowEl = nextElementSibling(rowEl);
	}
}

onReady(function()
{
	createRow();
});
</script>
</head>
<body>
<form method="post" action="fastcommit.php">
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
