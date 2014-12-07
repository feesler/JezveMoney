<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
	var currency = <?=f_json_encode($currArr)?>;

	onReady(initControls);
</script>
</head>
<body>
<a href="./index.php">Admin</a><br>
<b>Currencies</b> <a href="./query.php">Queries</a> <a href="./log.php">Logs</a> <a href="./apitest.php">API test</a>
<?php	checkMessage();		?>
<table class="curr_tbl">
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
			<td><input class="curr_act_btn" type="button" value="select" onclick="onSelectCurrency(<?=$currInfo[0]?>);"></td></tr>
<?php	}	?>
	</tbody>
	</table>

	<select id="curr_sel" onchange="onCurrSel()">
	<option value="0"></option>
<?php	foreach($currArr as $currInfo) {		?>
	<option value="<?=$currInfo[0]?>"><?=$currInfo[1]?></option>
<?php	}	?>
</select>

<input class="curr_act_btn" type="button" value="new" onclick="newCurr()">

<form method="post" action="../modules/currency.php?act=del" onsubmit="return onDeleteSubmit(this);">
<input id="del_curr_id" name="curr_id" type="hidden">
<div id="del_btn" style="display: none;"><input class="curr_act_btn" type="submit" value="delete"></div>
</form>

<div id="curr_content" class="curr_content" style="display: none;">
	<div class="box">
		<form id="curr_frm" method="post" action="../modules/currency.php?act=new">
		<input id="curr_id" name="curr_id" type="hidden">
		<label for="curr_name">name</label>
		<div class="s_inp"><input id="curr_name" name="curr_name" type="text"></div>
		<label for="curr_sign">sign</label>
		<div class="s_inp"><input id="curr_sign" name="curr_sign" type="text"></div>
		<div class="check_wr"><input id="curr_format" name="curr_format" type="checkbox"><label for="curr_format">sign before value</label></div>
		<input class="curr_act_btn" type="submit" value="ok">
		</form>

		<div class="close_btn">
			<div class="iconlink small_icon"><button onclick="onClosePopup();" type="button"><span class="icon close_gray"></span></button></div>
		</div>
	</div>
</div>
</body>
</html>
