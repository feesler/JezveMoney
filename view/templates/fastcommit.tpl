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
var curTrRows = 1;

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

	rowsContainer = ge('rowsContainer');
	if (!rowsContainer)
		return;

	rowEl = ce('div', { id : 'tr_' + (curTrRows + 1), className : 'tr_row' },
		[ce('select', { name : 'tr_type[]' },
				[ ce('option', { value : 'expense', innerHTML : '-' }),
					ce('option', { value : 'income', innerHTML : '+' })	]),
					ce('input', { type : 'text', name : 'amount[]', placeholder : 'Amount' }),
					ce('input', { type : 'text', name : 'date[]', placeholder : 'Date' }),
					ce('input', { type : 'text', name : 'comment[]', placeholder : 'Comment' }),
					ce('input', { type : 'button',
									onclick : delRow.bind(null, curTrRows + 1),
									value : '-' })
				]);

	rowsContainer.appendChild(rowEl);
	curTrRows++;
}
</script>
</head>
<body>
<form method="post" action="fastcommit.php">
	<select name="acc_id">
<?php foreach($accArr as $accObj) {	?>
		<option value="<?=$accObj->id?>"><?=$accObj->name?></option>
<?php }	?>
	</select>
	<div id="rowsContainer">
		<div id="tr_1" class="tr_row">
			<select name="tr_type[]">
				<option value="expense">-</option>
				<option value="income">+</option>
			</select><!--
			--><input name="amount[]" type="text" value="" placeholder="Amount"><!--
			--><input name="date[]" type="text" value="" placeholder="Date"><!--
			--><input name="comment[]" type="text" value="" placeholder="Comment"><!--
			--><input type="button" onclick="delRow(1)" value="-">
		</div>
	</div>
	<div>
		<input type="button" onclick="createRow()" value="+">
	</div>
	<div>
		<input type="submit" value="Commit">
	</div>
</form>
</body>
</html>
