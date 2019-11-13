<?php	include("./view/templates/commonhdr.tpl");	?>
<style>
table{border-collapse:collapse;}
td{ padding: 2px 5px; border:1px solid #000000; }
.id_cell{ background-color: #D0D0D0; }
.id_cell > a{ text-decoration: none; }
input[type="button"]{ border: 0 none; padding: 2px 5px; }
.sum_cell{ text-align: right; }
.act_sum{ background-color: #B0FFB0; }
.bad_val{ background-color: #FFB0B0; }
</style>
<script>
	var transactions = <?=f_json_encode($transArr)?>;
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
		var params = { 'id' : trans_id, 'pos' : newPos };

		ajax.post(baseURL + 'api/transaction/setpos', urlJoin(params), onChangePosCallback);
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

</script>
</head>
<body>
<?php	if ($fixed) {	?>
	<span style="color: #80FF80;">Balance value was fixed</span><br>
<?php	}	?>
<?php	if (isset($posUpd)) {		?>
<?php		if ($posUpd == TRUE) {	?>
	<span style="color: #80FF80;">Position was updated</span><br>
<?php		} else if ($posUpd == FALSE) {	?>
	<span style="color: #FF8080;">Fail to update position</span><br>
<?php		}	?>
<?php	}	?>
<table>
<?php	if ($checkAccount_id == 0) {	?>
	<tr><td colspan="9">All accounts</td></tr>
<?php	}	?>
	<tr>
		<td colspan="9">
			<table>
				<tr><td>ID</td><td>Account</td><td>initBalance</td><td>curBalance</td></tr>
<?php	foreach($accName as $acc_id => $acc_name) {		?>
				<tr>
					<td><?=$acc_id?></td>
					<td><?=$acc_name?></td>
					<td><?=$initBalance[$acc_id]?></td>
					<td><?=$curBalance[$acc_id]?></td>
				</tr>
<?php	}	?>
			</table>
		</td>
	</tr>

	<tr><td>ID</td><td>Type</td><td>Source amount</td><td>Destination amount</td><td>Comment</td><td>Source balance</td><td>Destination balance</td><td>Date</td><td>Pos</td></tr>
<?php	foreach($transArr as $tr_id => $tr) {	?>
	<tr>
		<td class="id_cell">
			<a href="<?=BASEURL?>transactions/edit/<?=$tr_id?>" target="_blank"><?=$tr_id?></a>
		</td>
<?php	if ($tr["type"] == EXPENSE) {		?>
<?php		if ($checkAccount_id == 0) {	?>
		<td>Expense from <?=$tr["src_name"]?></td>
<?php		} else {	?>
		<td>Expense</td>
<?php		}	?>
<?php		if ($tr["src_amount"] == $tr["dest_amount"]) {	?>
		<td class="sum_cell" colspan="2">- <?=$tr["dest_amount"]?></td>
<?php		} else {	?>
		<td class="sum_cell">-<?=$tr["src_amount"]?></td><td class="sum_cell act_sum">- <?=$tr["dest_amount"]?></td>
<?php		}	?>
<?php	} else if ($tr["type"] == INCOME) {	?>
<?php		if ($checkAccount_id == 0) {	?>
		<td>Income to <?=$tr["dest_name"]?></td>
<?php		} else {	?>
		<td>Income</td>
<?php		}	?>
<?php		if ($tr["src_amount"] == $tr["dest_amount"]) {	?>
		<td class="sum_cell" colspan="2">+ <?=$tr["dest_amount"]?></td>
<?php		} else {	?>
		<td class="sum_cell">+<?=$tr["src_amount"]?></td><td class="sum_cell act_sum">+ <?=$tr["dest_amount"]?></td>
<?php		}	?>
<?php	} else if ($checkAccount_id != 0 && $tr["type"] == TRANSFER && $tr["dest_id"] == $checkAccount_id) {	/* transfer to */	?>
		<td>Transfer from <?=$tr["src_name"]?></td>
<?php		if ($tr["src_amount"] == $tr["dest_amount"]) {		?>
		<td class="sum_cell" colspan="2">+<?=$tr["dest_amount"]?></td>
<?php		} else {	?>
		<td class="sum_cell act_sum">+<?=$tr["src_amount"]?></td><td class="sum_cell">+<?=$tr["dest_amount"]?></td>
<?php		}	?>
<?php	} else if ($checkAccount_id != 0 && $tr["type"] == TRANSFER && $tr["src_id"] == $checkAccount_id) {		/* transfer from */	?>
		<td>Transfer to <?=$tr["dest_name"]?></td>
<?php		if ($tr["src_amount"] == $tr["dest_amount"]) {		?>
		<td class="sum_cell" colspan="2">-<?=$tr["dest_amount"]?></td>
<?php		} else {	?>
		<td class="sum_cell">-<?=$tr["src_amount"]?></td><td class="sum_cell act_sum">-<?=$tr["dest_amount"]?></td>
<?php		}	?>
<?php	} else if ($checkAccount_id == 0 && $tr["type"] == TRANSFER) {		/* Transfer between two accounts */		?>
		<td>Transfer from <?=$tr["src_name"]?> to <?=$tr["dest_name"]?></td>
<?php		if ($tr["src_amount"] == $tr["dest_amount"]) {		?>
		<td class="sum_cell" colspan="2">-<?=$tr["dest_amount"]?></td>
<?php		} else {	?>
		<td class="sum_cell">-<?=$tr["src_amount"]?></td><td class="sum_cell act_sum">-<?=$tr["dest_amount"]?></td>
<?php		}	?>
<?php	} else if ($tr["type"] == DEBT) {		?>
		<td>Debt from <?=$tr["src_name"]?> to <?=$tr["dest_name"]?></td>
<?php		if ($tr["src_amount"] == $tr["dest_amount"]) {	?>
		<td class="sum_cell" colspan="2">-<?=$tr["dest_amount"]?></td>
<?php		} else {		?>
		<td class="sum_cell">-<?=$tr["src_amount"]?></td><td class="sum_cell act_sum">-<?=$tr["dest_amount"]?></td>
<?php		}	?>
<?php	}	?>
		<td><?=$tr["comment"]?></td>
<?php	$cspan = ($tr["src_id"] && $tr["dest_id"]) ? "" : " colspan=\"2\"";
		if ($tr["src_id"]) {
			if ($tr["realbal"][ $tr["src_id"] ] < 0.0) {	?>
		<td class="sum_cell bad_val"<?=$cspan?>><?=$tr["realbal"][ $tr["src_id"] ]?></td>
<?php		} else {		?>
		<td class="sum_cell"<?=$cspan?>><?=$tr["realbal"][ $tr["src_id"] ]?></td>
<?php		}
		}

		if ($tr["dest_id"]) {
			if ($tr["realbal"][ $tr["dest_id"] ] < 0.0) {	?>
		<td class="sum_cell bad_val"<?=$cspan?>><?=$tr["realbal"][ $tr["dest_id"] ]?></td>
<?php		} else {		?>
		<td class="sum_cell"<?=$cspan?>><?=$tr["realbal"][ $tr["dest_id"] ]?></td>
<?php		}
		}

		if (!$tr["correctdate"]) {		?>
		<td class="bad_val"><?=$tr["datefmt"]?></td>
<?php	} else {	?>
		<td><?=$tr["datefmt"]?></td>
<?php	}		?>
		<td id="tr_<?=$tr_id?>"><input type="button" value="<?=$tr["pos"]?>"></td>
	</tr>
<?php	}		?>
	<tr>
		<td colspan="9">
			<table>
				<tr><td>ID</td><td>Account</td><td>realBalance</td><td>diference</td></tr>
<?php	foreach($balanceDiff as $acc_id => $bdiff) {	?>
<?php		if ($checkAccount_id == 0 || ($checkAccount_id != 0 && $checkAccount_id == $acc_id)) {		?>
				<tr>
					<td><?=$acc_id?></td>
					<td><?=$accName[$acc_id]?></td>
					<td><?=$realBalance[$acc_id]?></td>
					<td><?=$bdiff?></td>
				</tr>
<?php		}	?>
<?php	}	?>
			</table>
		</td>
	</tr>
</table>

<?php	if ($checkAccount_id != 0 && $balanceDiff[$checkAccount_id] != 0) {	?>
<form method="post" action="./checkbalance.php?id=<?=$checkAccount_id?>&act=fix">
<input name="fixbal" type="hidden" value="<?=$realBalance[$checkAccount_id]?>">
<input type="submit" value="Fix balance">
</form>
<?php	}	?>
</body>
</html>