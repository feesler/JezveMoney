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

</script>
</head>
<body>
<?php	if ($fixed) {	?>
	<span style="color: #80FF80;">Balance value was fixed</span><br>
<?php	}	?>
<?php	if (isset($posUpd)) {		?>
<?php		if ($posUpd == TRUE) {	?>
	<span style="color: #80FF80;">Position was updated</span><br>
<?php		} else if ($posUpd == TRUE) {	?>
	<span style="color: #FF8080;">Fail to update position</span><br>
<?php		}	?>
<?php	}	?>
<table>
<?php	if ($checkAccount_id == 0) {	?>
	<tr><td colspan="8">All accounts</td></tr>
<?php	}	?>
	<tr>
		<td colspan="8">
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

	<tr><td>ID</td><td>Type</td><td>Source amount</td><td>Destination amount</td><td>Comment</td><td>Real balance</td><td>Date</td><td>Pos</td></tr>
<?php	foreach($transArr as $tr_id => $tr) {	?>
	<tr>
<?php	if (($checkAccount_id == 0 && $tr["type"] == TRANSFER) || ($tr["type"] == DEBT && $tr["src_id"] && $tr["dest_id"])) {	?>
		<td rowspan="2" class="id_cell">
<?php	} else {	?>
		<td class="id_cell">
<?php	}	?>
			<a href="<?=BASEURL?>transactions/edit/<?=$tr_id?>" target="_blank"><?=$tr_id?></a>
		</td>
<?php	if ($tr["type"] == EXPENSE) {		?>
<?php		if ($checkAccount_id == 0) {	?>
		<td>Expense from <?=$tr["src_name"]?></td>
<?php		} else {	?>
		<td>Expense</td>
<?php		}	?>
<?php		if ($tr["src_amount"] == $tr["dest_amount"]) {	?>
		<td class="sum_cell" colspan="2">-<?=$tr["dest_amount"]?></td>
<?php		} else {	?>
		<td class="sum_cell">-<?=$tr["src_amount"]?></td><td class="sum_cell act_sum">-<?=$tr["dest_amount"]?></td>
<?php		}	?>
<?php	} else if ($tr["type"] == INCOME) {	?>
<?php		if ($checkAccount_id == 0) {	?>
		<td>Income to <?=$tr["dest_name"]?></td>
<?php		} else {	?>
		<td>Income</td>
<?php		}	?>
<?php		if ($tr["src_amount"] == $tr["dest_amount"]) {	?>
		<td class="sum_cell" colspan="2">+<?=$tr["dest_amount"]?></td>
<?php		} else {	?>
		<td class="sum_cell">+<?=$tr["src_amount"]?></td><td class="sum_cell act_sum">+<?=$tr["dest_amount"]?></td>
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
		<td rowspan="2">Transfer from <?=$tr["src_name"]?> to <?=$tr["dest_name"]?></td>
<?php		if ($tr["src_amount"] == $tr["dest_amount"]) {		?>
		<td rowspan="2" class="sum_cell" colspan="2">-<?=$tr["dest_amount"]?></td>
<?php		} else {	?>
		<td rowspan="2" class="sum_cell">-<?=$tr["src_amount"]?></td><td rowspan="2" class="sum_cell act_sum">-<?=$tr["dest_amount"]?></td>
<?php		}	?>
		<td rowspan="2"><?=$tr["comment"]?></td>
<?php		if ($tr["realbal"][$tr["src_id"]] < 0.0) {		?>
		<td class="sum_cell bad_val"><?=$tr["realbal"][$tr["src_id"]]?></td>
<?php		} else {	?>
		<td class="sum_cell"><?=$tr["realbal"][$tr["src_id"]]?></td>
<?php		}	?>
<?php		if (!$tr["correctdate"]) {		?>
		<td rowspan="2" class="bad_val"><?=$tr["datefmt"]?></td>
<?php		} else {	?>
		<td rowspan="2"><?=$tr["datefmt"]?></td>
<?php		}		?>
		<td rowspan="2" id="tr_<?=$tr_id?>"><input type="button" value="<?=$tr["pos"]?>" onclick="showChangePos(<?=$tr_id?>, <?=$tr["pos"]?>);"></td>
	</tr>
<?php		if ($tr["realbal"][$tr["dest_id"]] < 0.0) {		?>
	<tr><td class="sum_cell bad_val"><?=$tr["realbal"][$tr["dest_id"]]?></td></tr>
<?php		} else {		?>
	<tr><td class="sum_cell"><?=$tr["realbal"][$tr["dest_id"]]?></td></tr>
<?php		}	?>
<?php	} else if ($tr["type"] == DEBT) {		?>
<?php	$rowspan = ($tr["src_id"] && $tr["dest_id"]) ? " rowspan=\"2\"" : "";		?>
		<td<?=$rowspan?>>Debt from <?=$tr["src_name"]?> to <?=$tr["dest_name"]?></td>
<?php		if ($tr["src_amount"] == $tr["dest_amount"]) {	?>
		<td<?=$rowspan?> class="sum_cell" colspan="2">-<?=$tr["dest_amount"]?></td>
<?php		} else {		?>
		<td<?=$rowspan?> class="sum_cell">-<?=$tr["src_amount"]?></td><td class="sum_cell act_sum">-<?=$tr["dest_amount"]?></td>
<?php		}	?>
		<td<?=$rowspan?>><?=$tr["comment"]?></td>
<?php	$resBal = $tr["realbal"][$tr[($tr["src_id"] != 0) ? "src_id" : "dest_id"]];	?>
<?php		if ($tr["src_id"] && $tr["dest_id"]) {		?>
<?php			if ($resBal < 0.0) {	?>
		<td class="sum_cell bad_val"><?=$resBal?></td>
<?php			} else {		?>
		<td class="sum_cell"><?=$resBal?></td>
<?php			}	?>
<?php		} else {		?>
<?php			if ($resBal < 0.0) {	?>
		<td<?=$rowspan?> class="sum_cell bad_val"><?=$resBal?></td>
<?php			} else {		?>
		<td<?=$rowspan?> class="sum_cell"><?=$resBal?></td>
<?php			}	?>
<?php		}	?>
<?php		if (!$tr["correctdate"]) {		?>
		<td<?=$rowspan?> class="bad_val"><?=$tr["datefmt"]?></td>
<?php		} else {	?>
		<td<?=$rowspan?>><?=$tr["datefmt"]?></td>
<?php		}		?>
		<td id="tr_<?=$tr_id?>"<?=$rowspan?>><input type="button" value="<?=$tr["pos"]?>" onclick="showChangePos(<?=$tr_id?>, <?=$tr["pos"]?>);"></td>
	</tr>
<?php		if ($tr["src_id"] && $tr["dest_id"]) {		?>
<?php			if ($tr["realbal"][$tr["dest_id"]] < 0.0) {		?>
	<tr><td class="sum_cell bad_val"><?=$tr["realbal"][$tr["dest_id"]]?></td></tr>
<?php			} else {		?>
	<tr><td class="sum_cell"><?=$tr["realbal"][$tr["dest_id"]]?></td></tr>
<?php			}	?>
<?php		}	?>
<?php	}	?>

<?php	if ($checkAccount_id != 0 && $tr["type"] != DEBT) {		?>
		<td><?=$tr["comment"]?></td>
<?php		if ($tr["realbal"][$checkAccount_id] < 0.0) {	?>
		<td class="sum_cell bad_val"><?=$tr["realbal"][$checkAccount_id]?></td>
<?php		} else {		?>
		<td class="sum_cell"><?=$tr["realbal"][$checkAccount_id]?></td>
<?php		}	?>
<?php		if (!$tr["correctdate"]) {		?>
		<td class="bad_val"><?=$tr["datefmt"]?></td>
<?php		} else {	?>
		<td><?=$tr["datefmt"]?></td>
<?php		}		?>

		<td id="tr_<?=$tr_id?>"><input type="button" value="<?=$tr["pos"]?>" onclick="showChangePos(<?=$tr_id?>, <?=$tr["pos"]?>);"></td>
	</tr>
<?php	} else if ($tr["type"] != TRANSFER && $tr["type"] != DEBT) {	?>
		<td><?=$tr["comment"]?></td>
<?php	$resBal = $tr["realbal"][$tr[($tr["type"] == EXPENSE) ? "src_id" : "dest_id"]];	?>

<?php		if ($resBal < 0.0) {	?>
		<td class="sum_cell bad_val"><?=$resBal?></td>
<?php		} else {		?>
		<td class="sum_cell"><?=$resBal?></td>
<?php		}	?>
<?php		if (!$tr["correctdate"]) {		?>
		<td class="bad_val"><?=$tr["datefmt"]?></td>
<?php		} else {	?>
		<td><?=$tr["datefmt"]?></td>
<?php		}		?>
		<td id="tr_<?=$tr_id?>"><input type="button" value="<?=$tr["pos"]?>" onclick="showChangePos(<?=$tr_id?>, <?=$tr["pos"]?>);"></td>
	</tr>
<?php
		}
	}
?>
	<tr>
		<td colspan="8">
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