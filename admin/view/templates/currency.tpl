<!DOCTYPE html>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<title>Admin panel | Currency</title>
<link rel="stylesheet" type="text/css" href="../view/css/common.css">
<link rel="stylesheet" type="text/css" href="../view/css/iconlink.css">
<script type="text/javascript" src="../view/js/es5-shim.min.js"></script>
<script type="text/javascript" src="../view/js/common.js"></script>
<script type="text/javascript" src="../view/js/app.js"></script>
<script>
	var currency = <?=f_json_encode($currArr)?>;

function findCurrency(id)
{
	var found = null;

	if (id != 0 && currency)
	{
		currency.some(function(curr)
		{
			if (curr[0] == id)
				found = curr;

			return (curr[0] == id);
		});
	}

	return found;
}


function setCurrencyValues(currObj)
{
	var curr_id, del_curr_id, curr_name, curr_sign, curr_format;

	curr_id = ge('curr_id');
	del_curr_id = ge('del_curr_id');
	curr_name = ge('curr_name');
	curr_sign = ge('curr_sign');
	curr_format = ge('curr_format');
	if (!curr_id || !del_curr_id || !curr_name || !curr_sign || !curr_format)
		return;

	if (currObj)
	{
		curr_id.value = currObj[0];
		del_curr_id.value = currObj[0];
		curr_name.value = currObj[1];
		curr_sign.value = currObj[2];
		curr_format.checked = (currObj[3] == 1);
	}
	else			// clean
	{
		curr_id.value = '';
		curr_id.value = '';
		curr_name.value = '';
		curr_sign.value = '';
		curr_format.checked = false;
	}
}


function selectCurrency(id)
{
	var curr_frm, currObj;

	curr_frm = ge('curr_frm');
	if (!curr_frm)
		return;

	currObj = findCurrency(id);
	if (currObj)
	{
		curr_frm.action = '../modules/currency.php?act=edit';
		setCurrencyValues(currObj);
		show('del_btn', true);
	}
	else			// clean
	{
		setCurrencyValues(null);
	}
}


function onSelectCurrency(id)
{
	selectCurrency(id);
	selectByValue(ge('curr_sel'), id);
}


function onCurrSel()
{
	var curr_sel;

	curr_sel = ge('curr_sel');
	if (!curr_sel)
		return;

	selectCurrency(selectedValue(curr_sel))
}


function newCurr()
{
	var curr_frm;

	curr_frm = ge('curr_frm');
	if (!curr_frm)
		return;

	curr_frm.action = '../modules/currency.php?act=new';
	setCurrencyValues(null);

	show('del_btn', false);
}


function onDeleteSubmit(frm)
{
	return confirm('Are you sure want to delete selected currency?');
}
</script>
</head>
<body>
<a href="./index.php">Admin</a><br>
<b>Currencies</b> <a href="./query.php">Queries</a> <a href="./log.php">Logs</a> <a href="./apitest.php">API test</a>
<?php	checkMessage();		?>
<table>
<thead>
<tr><td>id</td><td>name</td><td>sign</td><td>format</td><td></td></tr>
</thead>
<tbody>
<?php	foreach($currArr as $currInfo) {		?>
		<tr>
			<td><?=$currInfo[0]?></td>
			<td><?=$currInfo[1]?></td>
			<td><?=$currInfo[2]?></td>
			<td><?=$currInfo[3]?></td>
			<td><input type="button" value="select" onclick="onSelectCurrency(<?=$currInfo[0]?>);"></td></tr>
<?php	}	?>
	</tbody>
	</table>

	<select id="curr_sel" onchange="onCurrSel()">
	<option value="0"></option>
<?php	foreach($currArr as $currInfo) {		?>
	<option value="<?=$currInfo[0]?>"><?=$currInfo[1]?></option>
<?php	}	?>
</select>

<input type="button" value="new" onclick="newCurr()">

<form method="post" action="../modules/currency.php?act=del" onsubmit="return onDeleteSubmit(this);">
<input id="del_curr_id" name="curr_id" type="hidden">
<div id="del_btn" style="display: none;"><input type="submit" value="delete"></div>
</form>

<form id="curr_frm" method="post" action="../modules/currency.php?act=new">
<input id="curr_id" name="curr_id" type="hidden"><br>
<label for="curr_name">name</label><br><input id="curr_name" name="curr_name" type="text"><br>
<label for="curr_sign">sign</label><br><input id="curr_sign" name="curr_sign" type="text"><br>
<input id="curr_format" name="curr_format" type="checkbox"><label for="curr_format">sign before value</label><br>
<input type="submit" value="ok">
</form>

</body>
</html>
