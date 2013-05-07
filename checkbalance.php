<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");

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
	$checkAccount_id = intval($_GET["id"]);
	if (!$checkAccount_id)
		fail();

	$fixed = FALSE;

	if (isset($_GET["act"]) && $_GET["act"] == "fix")
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
	ebr("td{ padding: 2px 5px; }");
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

	$acc = new Account($userid);

	ebr("<table>");
	ebr("<tr><td colspan=\"8\">".$acc->getName($checkAccount_id)."</td></tr>");

	$resArr = $db->selectQ("*", "accounts", "id=".$checkAccount_id." AND user_id=".$userid);
	if (count($resArr) != 1)
		fail();

	$initBalance = floatval($resArr[0]["initbalance"]);
	$curBalance = floatval($resArr[0]["balance"]);

	ebr("<tr><td colspan=\"8\">initBalance: ".$initBalance."</td></tr>");
	ebr("<tr><td colspan=\"8\">curBalance: ".$curBalance."</td></tr>");
	ebr();

	$realBalance = $initBalance;


	ebr("<tr><td>ID</td><td>Type</td><td>Amount</td><td>Charge</td><td>Comment</td><td>Real balance</td><td>Date</td><td>Pos</td></tr>");

	$accNameCache = array();

	$prev_date = 0;

	$resArr = $db->selectQ("*", "transactions", "(src_id=".$checkAccount_id." AND (type=1 OR type=3)) OR (dest_id=".$checkAccount_id." AND (type=2 OR type=3))", NULL, "pos");
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

		$src_name = $acc->getName($tr_src_id);
		$dest_name = $acc->getName($tr_dest_id);

		echo("<tr><td style=\"background-color: #D0D0D0;\"><a href=\"./edittransaction.php?id=".$tr_id."\" target=\"_blank\">".$tr_id."</a></td>");

		if ($tr_type == 1)				// expense
		{
			echo("<td>Expense</td><td class=\"sum_cell\"");

			if ($amount == $charge)
				echo(" colspan=\"2\">-".$charge."</td>");
			else
				echo(">-".$amount."</td><td class=\"sum_cell act_sum\">-".$charge."</td>");

			$realBalance = round($realBalance - $charge, 2);
		}
		else if ($tr_type == 2)			// income
		{
			echo("<td>Income</td><td class=\"sum_cell\"");

			if ($amount == $charge)
				echo(" colspan=\"2\">+".$charge."</td>");
			else
				echo(">+".$amount."</td><td class=\"sum_cell act_sum\">+".$charge."</td>");

			$realBalance = round($realBalance + $charge, 2);
		}
		else if ($tr_type == 3 && $tr_dest_id == $checkAccount_id)			// transfer to
		{
			echo("<td>Transfer from ".$src_name."</td><td");

			if ($amount == $charge)
				echo(" class=\"sum_cell\" colspan=\"2\">+".$charge."</td>");
			else
				echo(" class=\"sum_cell act_sum\">+".$amount."</td><td class=\"sum_cell\">+".$charge."</td>");

			$realBalance = round($realBalance + $amount, 2);
		}
		else if ($tr_type == 3 && $tr_src_id == $checkAccount_id)			// transfer from
		{
			echo("<td>Transfer to ".$dest_name."</td><td class=\"sum_cell\"");

			if ($amount == $charge)
				echo(" colspan=\"2\">-".$charge."</td>");
			else
				echo(">-".$amount."</td><td class=\"sum_cell act_sum\">-".$charge."</td>");

			$realBalance = round($realBalance - $charge, 2);
		}

		echo("<td>".$comment."</td>");
		echo("<td class=\"sum_cell");
		if ($realBalance < 0.0)
			echo(" bad_val");
		echo("\">".$realBalance."</td>");

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

	$balanceDiff = round($realBalance - $curBalance, 2);

	ebr("<tr><td colspan=\"8\"></td></tr>");
	ebr("<tr><td colspan=\"8\">realBalance: ".$realBalance."</td></tr>");
	ebr("<tr><td colspan=\"8\">diference: ".$balanceDiff."</td></tr>");
	ebr("</table>");

	if ($balanceDiff != 0)
	{
		ebr("<form method=\"post\" action=\"./checkbalance.php?id=".$checkAccount_id."&act=fix\">");
		ebr("<input name=\"fixbal\" type=\"hidden\" value=\"".$realBalance."\">");
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