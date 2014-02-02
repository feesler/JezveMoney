<?php
	require_once("./setup.php");


	function fail()
	{
		ebr("fail");
		exit();
	}


	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

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

	ebr("<!DOCTYPE HTML>");
	ebr("<html>");
	ebr("<head>");
	ebr("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">");
	ebr("<title>".$titleString."</title>");
	ebr("<style>");
	ebr("table{border-collapse:collapse;}");
	ebr("td{ padding: 2px 5px; border:1px solid #000000; }");
	ebr(".id_cell{ background-color: #D0D0D0; }");
	ebr(".id_cell > a{ text-decoration: none; }");
	ebr("input[type=\"button\"]{ border: 0 none; padding: 2px 5px; }");
	ebr(".sum_cell{ text-align: right; }");
	ebr(".act_sum{ background-color: #B0FFB0; }");
	ebr(".bad_val{ background-color: #FFB0B0; }");
	ebr("</style>");
	echo(getJS("common.js"));
	ebr("<script>");
?>
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
<?php
	ebr("</script>");
	ebr("</head>");
	ebr("<body>");

	if ($fixed)
		ebr("<span style=\"color: #80FF80;\">Balance value was fixed</span><br>");
	if (isset($posUpd))
	{
		if ($posUpd == TRUE)
			ebr("<span style=\"color: #80FF80;\">Position was updated</span><br>");
		else if ($posUpd == TRUE)
			ebr("<span style=\"color: #FF8080;\">Fail to update position</span><br>");
	}

	$acc = new Account($userid, TRUE);

	ebr("<table>");

	if ($checkAccount_id == 0)
		ebr("<tr><td colspan=\"8\">All accounts</td></tr>");

	$condition = "user_id=".$userid;
	if ($checkAccount_id != 0)
		$condition .= " AND id=".$checkAccount_id;
	$resArr = $db->selectQ("*", "accounts", $condition);
	if (count($resArr) == 0)
		fail();

	ebr("<tr><td colspan=\"8\"><table>");
	ebr("<tr><td>Account</td><td>initBalance</td><td>curBalance</td></tr>");

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

		echo("<tr><td>".$accName[$acc_id]."</td>");
		echo("<td>".$initBalance[$acc_id]."</td>");
		echo("<td>".$curBalance[$acc_id]."</td></tr>");
		ebr();

		$realBalance[$acc_id] = $initBalance[$acc_id];
	}

	ebr("</table></td></tr>");


	ebr("<tr><td>ID</td><td>Type</td><td>Amount</td><td>Charge</td><td>Comment</td><td>Real balance</td><td>Date</td><td>Pos</td></tr>");

	$accNameCache = array();

	$prev_date = 0;

	$condition = "user_id=".$userid;
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


		echo("<tr><td");
		if ($checkAccount_id == 0 && $tr_type == 3)
			echo(" rowspan=\"2\"");
		echo(" class=\"id_cell\"><a href=\"./edittransaction.php?id=".$tr_id."\" target=\"_blank\">".$tr_id."</a></td>");

		if ($tr_type == 1)				// expense
		{
			echo("<td>Expense");
			if ($checkAccount_id == 0)
				echo(" from ".$src_name);
			echo("</td><td class=\"sum_cell\"");

			if ($amount == $charge)
				echo(" colspan=\"2\">-".$charge."</td>");
			else
				echo(">-".$amount."</td><td class=\"sum_cell act_sum\">-".$charge."</td>");

			$realBalance[$tr_src_id] = round($realBalance[$tr_src_id] - $charge, 2);
		}
		else if ($tr_type == 2)			// income
		{
			echo("<td>Income");
			if ($checkAccount_id == 0)
				echo(" to ".$dest_name);
			echo("</td><td class=\"sum_cell\"");

			if ($amount == $charge)
				echo(" colspan=\"2\">+".$charge."</td>");
			else
				echo(">+".$amount."</td><td class=\"sum_cell act_sum\">+".$charge."</td>");

			$realBalance[$tr_dest_id] = round($realBalance[$tr_dest_id] + $charge, 2);
		}
		else if ($checkAccount_id != 0 && $tr_type == 3 && $tr_dest_id == $checkAccount_id)			// transfer to
		{
			echo("<td>Transfer from ".$src_name."</td><td");

			if ($amount == $charge)
				echo(" class=\"sum_cell\" colspan=\"2\">+".$charge."</td>");
			else
				echo(" class=\"sum_cell act_sum\">+".$amount."</td><td class=\"sum_cell\">+".$charge."</td>");

			$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] + $amount, 2);
		}
		else if ($checkAccount_id != 0 && $tr_type == 3 && $tr_src_id == $checkAccount_id)			// transfer from
		{
			echo("<td>Transfer to ".$dest_name."</td><td class=\"sum_cell\"");

			if ($amount == $charge)
				echo(" colspan=\"2\">-".$charge."</td>");
			else
				echo(">-".$amount."</td><td class=\"sum_cell act_sum\">-".$charge."</td>");

			$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] - $charge, 2);
		}
		else if ($checkAccount_id == 0 && $tr_type == 3)		// Transfer between two accounts
		{
			echo("<td rowspan=\"2\">Transfer from ".$src_name." to ".$dest_name."</td><td rowspan=\"2\" class=\"sum_cell\"");

			if ($amount == $charge)
				echo(" colspan=\"2\">-".$charge."</td>");
			else
				echo(">-".$amount."</td><td rowspan=\"2\" class=\"sum_cell act_sum\">-".$charge."</td>");

			echo("<td rowspan=\"2\">".$comment."</td>");

			$realBalance[$tr_src_id] = round($realBalance[$tr_src_id] - $charge, 2);
			$realBalance[$tr_dest_id] = round($realBalance[$tr_dest_id] + $amount, 2);

			echo("<td class=\"sum_cell");
			if ($realBalance[$tr_src_id] < 0.0)
				echo(" bad_val");
			echo("\">".$realBalance[$tr_src_id]."</td>");

			echo("<td rowspan=\"2\"");
			$trans_date = strtotime($trdate);
			if ($trans_date < $prev_date)
				echo(" class=\"bad_val\"");
			else if ($trans_date > $prev_date)
				$prev_date = $trans_date;

			echo(">".date("d.m.Y", $trans_date)."</td>");
			echo("<td rowspan=\"2\" id=\"tr_".$tr_id."\"><input type=\"button\" value=\"".$tr_pos."\" onclick=\"showChangePos(".$tr_id.", ".$tr_pos.");\"></td>");
			ebr("</tr>");

			// second row for balance of destination account
			echo("<tr><td class=\"sum_cell");
			if ($realBalance[$tr_src_id] < 0.0)
				echo(" bad_val");
			echo("\">".$realBalance[$tr_dest_id]."</td></tr>");
		}
		else if ($tr_type == 4)
		{
			echo("<td>Debt from ".$src_name." to ".$dest_name."</td><td class=\"sum_cell\"");

			if ($amount == $charge)
				echo(" colspan=\"2\">-".$charge."</td>");
			else
				echo(">-".$amount."</td><td class=\"sum_cell act_sum\">-".$charge."</td>");

			$realBalance[$tr_src_id] = round($realBalance[$tr_src_id] - $charge, 2);
			$realBalance[$tr_dest_id] = round($realBalance[$tr_dest_id] + $amount, 2);
		}

		if ($checkAccount_id != 0)
		{
			echo("<td>".$comment."</td>");
			echo("<td class=\"sum_cell");
			if ($realBalance[$checkAccount_id] < 0.0)
				echo(" bad_val");
			echo("\">".$realBalance[$checkAccount_id]."</td>");

			echo("<td");
			$trans_date = strtotime($trdate);
			if ($trans_date < $prev_date)
				echo(" class=\"bad_val\"");
			else if ($trans_date > $prev_date)
				$prev_date = $trans_date;
	
			echo(">".date("d.m.Y", $trans_date)."</td>");
			echo("<td id=\"tr_".$tr_id."\"><input type=\"button\" value=\"".$tr_pos."\" onclick=\"showChangePos(".$tr_id.", ".$tr_pos.");\"></td>");
			ebr("</tr>");
		}
		else if ($tr_type != 3)
		{
			echo("<td>".$comment."</td>");
			echo("<td class=\"sum_cell");
			if ($tr_type == 1)
				$tacc_id = $tr_src_id;
			else
				$tacc_id = $tr_dest_id;

			if ($realBalance[$tacc_id] < 0.0)
				echo(" bad_val");
			echo("\">".$realBalance[$tacc_id]."</td>");

			echo("<td");
			$trans_date = strtotime($trdate);
			if ($trans_date < $prev_date)
				echo(" class=\"bad_val\"");
			else if ($trans_date > $prev_date)
				$prev_date = $trans_date;
	
			echo(">".date("d.m.Y", $trans_date)."</td>");
			echo("<td id=\"tr_".$tr_id."\"><input type=\"button\" value=\"".$tr_pos."\" onclick=\"showChangePos(".$tr_id.", ".$tr_pos.");\"></td>");
			ebr("</tr>");
		}
	}

	$balanceDiff = array();

	ebr("<tr><td colspan=\"8\"><table>");
	ebr("<tr><td>Account</td><td>realBalance</td><td>diference</td></tr>");
	foreach($realBalance as $acc_id => $rbrow)
	{
		$balanceDiff[$acc_id] = round($rbrow - $curBalance[$acc_id], 2);
		ebr("<tr><td>".$accName[$acc_id]."</td>");
		ebr("<td>".$rbrow."</td>");
		ebr("<td>".$balanceDiff[$acc_id]."</td></tr>");
	}

	ebr("</table></td></tr>");

	ebr("</table>");

	if ($checkAccount_id != 0 && $balanceDiff[$checkAccount_id] != 0)
	{
		ebr("<form method=\"post\" action=\"./checkbalance.php?id=".$checkAccount_id."&act=fix\">");
		ebr("<input name=\"fixbal\" type=\"hidden\" value=\"".$realBalance[$checkAccount_id]."\">");
		ebr("<input type=\"submit\" value=\"Fix balance\">");
		ebr("</form>");
	}

	ebr("<form id=\"trposfrm\" method=\"post\" action=\"./modules/setpos.php\">");
	ebr("<input id=\"trans_id\" name=\"trans_id\" type=\"hidden\" value=\"0\">");
	ebr("<input id=\"trans_pos\" name=\"trans_pos\" type=\"hidden\" value=\"0\">");
	ebr("<input name=\"trans_acc\" type=\"hidden\" value=\"".$checkAccount_id."\">");
	ebr("</form>");

	ebr("</body>");
	ebr("</html>");
?>