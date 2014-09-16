<?php
	require_once("./setup.php");


	function fail()
	{
		echo("fail");
		exit();
	}

	checkUser();

	if (!isset($_GET["id"]))
		fail();

	if ($_GET["id"] == "all")
	{
		$checkAccount_id = 0;
	}
	else
	{
		$checkAccount_id = intval($_GET["id"]);
		if (!$checkAccount_id)
			fail();
	}

	$fixed = FALSE;

	if (isset($_GET["act"]) && $_GET["act"] == "fix" && $checkAccount_id != 0)
	{
		if (isset($_POST["fixbal"]))
		{
			$fixbal = floatval($_POST["fixbal"]);

			if (!$db->updateQ("accounts", array("balance"), array($fixbal), "id=".$checkAccount_id))
				fail();

			$fixed = TRUE;
		}
	}


	if (isset($_GET["pos"]))
	{
		if ($_GET["pos"] == "ok")
			$posUpd = TRUE;
		else if ($_GET["pos"] == "fail")
			$posUpd = FALSE;
	}

	$titleString = "jezve Money - Check balance";

	header("Content-type: text/html; charset=utf-8");
?>
<!DOCTYPE HTML>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title><?=$titleString?></title>
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
<script type="text/javascript" src="./js/common.js"></script>
<script>
	var chPosObj = null;

	function onSubmitNewPos()
	{
		var frm, trans_pos, posField;

		frm = ge('trposfrm');
		trans_pos = ge('trans_pos');
		if (!frm || !trans_pos)
			return;

		if (!chPosObj || !chPosObj.firstElementChild)
			return;

		posField = chPosObj.firstElementChild;
		if (posField.tagName.toLowerCase() != 'input' || !posField.value || posField.value == '' || !isNum(posField.value))
			return;

		trans_pos.value = parseInt(posField.value);

		frm.submit();
	}


	function showChangePos(tr_id, curPos)
	{
		var tr_cell, trans_id;

		tr_cell = ge('tr_' + tr_id);
		trans_id = ge('trans_id');
		if (!tr_cell || !trans_id)
			return;

		if (chPosObj != null)
		{
			chPosObj.parentNode.removeChild(chPosObj);
			chPosObj = null;
		}

		posObj = ce('div', { style : { display : 'inline-block', marginLeft : '5px' } },
							[ ce('input', { type : 'text', value : curPos, style : { width : '60px' } }),
							ce('input', { type : 'button', value : 'ok', onclick : onSubmitNewPos })]);
		if (posObj)
		{
			tr_cell.appendChild(posObj);
			chPosObj = posObj;
			trans_id.value = parseInt(tr_id);
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
<?php
	$acc = new Account($user_id, TRUE);
?>
<table>
<?php	if ($checkAccount_id == 0) {	?>
	<tr><td colspan="8">All accounts</td></tr>
<?php	}	?>
<?php
	$condition = "user_id=".$user_id;
	if ($checkAccount_id != 0)
		$condition .= " AND id=".$checkAccount_id;
	$resArr = $db->selectQ("*", "accounts", $condition);
	if (count($resArr) == 0)
		fail();
?>
	<tr><td colspan="8"><table>
	<tr><td>Account</td><td>initBalance</td><td>curBalance</td></tr>
<?php
	$initBalance = array();
	$curBalance = array();
	$realBalance = array();
	$accName = array();
	foreach($resArr as $row)
	{
		$acc_id = intval($row["id"]);
		$initBalance[$acc_id] = floatval($row["initbalance"]);
		$curBalance[$acc_id] = floatval($row["balance"]);
		$accName[$acc_id] = $acc->getNameOrPerson($acc_id);
?>
	<tr><td><?=$accName[$acc_id]?></td>
	<td><?=$initBalance[$acc_id]?></td>
	<td><?=$curBalance[$acc_id]?></td></tr>
<?php
		$realBalance[$acc_id] = $initBalance[$acc_id];
	}	?>

	</table></td></tr>

	<tr><td>ID</td><td>Type</td><td>Amount</td><td>Charge</td><td>Comment</td><td>Real balance</td><td>Date</td><td>Pos</td></tr>
<?php
	$accNameCache = array();

	$prev_date = 0;

	$condition = "user_id=".$user_id;
	if ($checkAccount_id != 0)
	{
		$condition .= " AND (";
		$condition .= "(src_id=".$checkAccount_id." AND (type=1 OR type=3 OR type=4))";	// source
		$condition .= " OR (dest_id=".$checkAccount_id." AND (type=2 OR type=3 OR type=4))";	// destination
		$condition .= ")";
	}

	$resArr = $db->selectQ("*", "transactions", $condition, NULL, "pos");
	foreach($resArr as $row)
	{
		$tr_id = intval($row["id"]);
		$tr_type = intval($row["type"]);
		$tr_src_id = intval($row["src_id"]);
		$tr_dest_id = intval($row["dest_id"]);
		$amount = floatval($row["amount"]);
		$charge = floatval($row["charge"]);
		$comment = $row["comment"];
		$trdate = $row["date"];
		$tr_pos = intval($row["pos"]);

		$src_name = $acc->getNameOrPerson($tr_src_id);
		$dest_name = $acc->getNameOrPerson($tr_dest_id);

?>
	<tr>
<?php	if ($checkAccount_id == 0 && $tr_type == 3) {	?>
		<td rowspan="2" class="id_cell">
<?php	} else {	?>
		<td class="id_cell">
<?php	}	?>
			<a href="./edittransaction.php?id=<?=$tr_id?>" target="_blank"><?=$tr_id?></a>
		</td>
<?php	if ($tr_type == 1) {		?>
<?php		if ($checkAccount_id == 0) {	?>
		<td>Expense from <?=$src_name?></td>
<?php		} else {	?>
		<td>Expense</td>
<?php		}	?>
<?php		if ($amount == $charge) {	?>
		<td class="sum_cell" colspan="2">-<?=$charge?></td>
<?php		} else {	?>
		<td class="sum_cell">-<?=$amount?></td><td class="sum_cell act_sum">-<?=$charge?></td>
<?php		}	?>
<?php
			$realBalance[$tr_src_id] = round($realBalance[$tr_src_id] - $charge, 2);
		} else if ($tr_type == 2) {	?>
<?php		if ($checkAccount_id == 0) {	?>
		<td>Income to <?=$dest_name?></td>
<?php		} else {	?>
		<td>Income</td>
<?php		}	?>
<?php		if ($amount == $charge) {	?>
		<td class="sum_cell" colspan="2">+<?=$charge?></td>
<?php		} else {	?>
		<td class="sum_cell">+<?=$amount?></td><td class="sum_cell act_sum">+<?=$charge?></td>
<?php		}	?>
<?php		$realBalance[$tr_dest_id] = round($realBalance[$tr_dest_id] + $charge, 2);
		} else if ($checkAccount_id != 0 && $tr_type == 3 && $tr_dest_id == $checkAccount_id) {		/* transfer to */		?>
		<td>Transfer from <?=$src_name?></td>
<?php		if ($amount == $charge) {		?>
		<td class="sum_cell" colspan="2">+<?=$charge?></td>
<?php		} else {	?>
		<td class="sum_cell act_sum">+<?=$amount?></td><td class="sum_cell">+<?=$charge?></td>
<?php		}	?>
<?php			$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] + $amount, 2);
		} else if ($checkAccount_id != 0 && $tr_type == 3 && $tr_src_id == $checkAccount_id) {			/* transfer from */		?>
		<td>Transfer to <?=$dest_name?></td>
<?php		if ($amount == $charge) {		?>
		<td class="sum_cell" colspan="2">-<?=$charge?></td>
<?php		} else {	?>
		<td class="sum_cell">-<?=$amount?></td><td class="sum_cell act_sum">-<?=$charge?></td>
<?php		}	?>
<?php
			$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] - $charge, 2);
		} else if ($checkAccount_id == 0 && $tr_type == 3) {		/* Transfer between two accounts */		?>
		<td rowspan="2">Transfer from <?=$src_name?> to <?=$dest_name?></td>
<?php		if ($amount == $charge) {		?>
		<td rowspan="2" class="sum_cell" colspan="2">-<?=$charge?></td>
<?php		} else {	?>
		<td rowspan="2" class="sum_cell">-<?=$amount?></td><td rowspan="2" class="sum_cell act_sum">-<?=$charge?></td>
<?php		}	?>
		<td rowspan="2"><?=$comment?></td>
<?php
			$realBalance[$tr_src_id] = round($realBalance[$tr_src_id] - $charge, 2);
			$realBalance[$tr_dest_id] = round($realBalance[$tr_dest_id] + $amount, 2);
?>
<?php		if ($realBalance[$tr_src_id] < 0.0) {		?>
		<td class="sum_cell bad_val"><?=$realBalance[$tr_src_id]?></td>
<?php		} else {	?>
		<td class="sum_cell"><?=$realBalance[$tr_src_id]?></td>
<?php		}	?>
<?php	$trans_date = strtotime($trdate);
			if ($trans_date < $prev_date) {		?>
		<td rowspan="2" class="bad_val"><?=date("d.m.Y", $trans_date)?></td>
<?php		} else {
				$prev_date = $trans_date;
?>
		<td rowspan="2"><?=date("d.m.Y", $trans_date)?></td>
<?php		}		?>
		<td rowspan="2" id="tr_<?=$tr_id?>"><input type="button" value="<?=$tr_pos?>" onclick="showChangePos(<?=$tr_id?>, <?=$tr_pos?>);"></td>
	</tr>
<?php		if ($realBalance[$tr_dest_id] < 0.0) {		?>
	<tr><td class="sum_cell bad_val"><?=$realBalance[$tr_dest_id]?></td></tr>
<?php		} else {		?>
	<tr><td class="sum_cell"><?=$realBalance[$tr_dest_id]?></td></tr>
<?php		}	?>
<?php	} else if ($tr_type == 4) {		?>
	<td>Debt from <?=$src_name?> to <?=$dest_name?></td>
<?php		if ($amount == $charge) {	?>
		<td class="sum_cell" colspan="2">-<?=$charge?></td>
<?php		} else {		?>
		<td class="sum_cell">-<?=$amount?></td><td class="sum_cell act_sum">-<?=$charge?></td>
<?php		}	?>
<?php
			$realBalance[$tr_src_id] = round($realBalance[$tr_src_id] - $charge, 2);
			$realBalance[$tr_dest_id] = round($realBalance[$tr_dest_id] + $amount, 2);
	}
?>
<?php	if ($checkAccount_id != 0) {		?>
		<td><?=$comment?></td>
<?php		if ($realBalance[$checkAccount_id] < 0.0) {	?>
		<td class="sum_cell bad_val"><?=$realBalance[$checkAccount_id]?></td>
<?php		} else {		?>
		<td class="sum_cell"><?=$realBalance[$checkAccount_id]?></td>
<?php		}	?>
<?php	$trans_date = strtotime($trdate);
			if ($trans_date < $prev_date) {		?>
		<td class="bad_val"><?=date("d.m.Y", $trans_date)?></td>
<?php		} else {
				$prev_date = $trans_date;
?>
		<td><?=date("d.m.Y", $trans_date)?></td>
<?php		}		?>

		<td id="tr_<?=$tr_id?>"><input type="button" value="<?=$tr_pos?>" onclick="showChangePos(<?=$tr_id?>, <?=$tr_pos?>);"></td>
	</tr>
<?php	} else if ($tr_type != 3) {	?>
		<td><?=$comment?></td>
<?php		$tacc_id = ($tr_type == 1) ? $tr_src_id : $tr_dest_id;		?>
<?php		if ($realBalance[$tacc_id] < 0.0) {	?>
		<td class="sum_cell bad_val"><?=$realBalance[$tacc_id]?></td>
<?php		} else {		?>
		<td class="sum_cell"><?=$realBalance[$tacc_id]?></td>
<?php		}	?>
<?php	$trans_date = strtotime($trdate);
			if ($trans_date < $prev_date) {		?>
		<td class="bad_val"><?=date("d.m.Y", $trans_date)?></td>
<?php		} else {
				$prev_date = $trans_date;
?>
		<td><?=date("d.m.Y", $trans_date)?></td>
<?php		}		?>
		<td id="tr_<?=$tr_id?>"><input type="button" value="<?=$tr_pos?>" onclick="showChangePos(<?=$tr_id?>, <?=$tr_pos?>);"></td>
	</tr>
<?php
	}
	}

	$balanceDiff = array();
?>
	<tr><td colspan="8"><table>
	<tr><td>Account</td><td>realBalance</td><td>diference</td></tr>
<?php	foreach($realBalance as $acc_id => $rbrow) {
		$balanceDiff[$acc_id] = round($rbrow - $curBalance[$acc_id], 2);
?>
		<tr><td><?=$accName[$acc_id]?></td>
		<td><?=$rbrow?></td>
		<td><?=$balanceDiff[$acc_id]?></td></tr>
<?php	}	?>

	</table></td></tr>
</table>

<?php	if ($checkAccount_id != 0 && $balanceDiff[$checkAccount_id] != 0) {	?>
<form method="post" action="./checkbalance.php?id=<?=$checkAccount_id?>&act=fix">
<input name="fixbal" type="hidden" value="<?=$realBalance[$checkAccount_id]?>">
<input type="submit" value="Fix balance">
</form>
<?php	}	?>

<form id="trposfrm" method="get" action="./modules/setpos.php">
<input id="trans_id" name="id" type="hidden" value="0">
<input id="trans_pos" name="pos" type="hidden" value="0">
</form>
</body>
</html>