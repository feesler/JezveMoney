<?php
	require_once("./system/setup.php");

	checkUser();

	header("Content-type: text/html; charset=utf-8");

	$accMod = new Account($user_id, FALSE);

	if ($_SERVER["REQUEST_METHOD"] == "POST")
	{
		$trMod = new Transaction($user_id);

		$acc_id = intval($_POST["acc_id"]);
		echo("Account: ".$acc_id."<br>");
		$curr_id = $accMod->getCurrency($acc_id);
		echo("Currency: ".$curr_id." ".Currency::getName($curr_id)."<br>");
		foreach($_POST["tr_type"] AS $tr_key => $tr_type)
		{
			$tr_amount = floatval($_POST["amount"][$tr_key]);

			$tr_time = strtotime($_POST["date"][$tr_key]);
			if ($tr_time == -1)
				die("Wrong date format: ".$_POST["date"][$tr_key]);

			$tr_date =  date("Y-m-d H:i:s", $tr_time);
			$tr_comment = $_POST["comment"][$tr_key];
			echo($tr_key." ".$tr_type." ".$tr_amount." ".$tr_date." ".$tr_comment."<br>");

			if ($tr_type == "expense")
			{
				$trans_id = $trMod->create(EXPENSE, $acc_id, 0, $tr_amount, $tr_amount, $curr_id, $curr_id, $tr_date, $tr_comment);
			}
			else if ($tr_type == "income")
			{
				$trans_id = $trMod->create(INCOME, 0, $acc_id, $tr_amount, $tr_amount, $curr_id, $curr_id, $tr_date, $tr_comment);
			}
			else
			{
				die("Wrong transaction type");
			}

			if ($trans_id == 0)
				die("Fail to create transaction<br>");
			else
				echo("New transaction id: ".$trans_id."<br>");
		}

		echo("<a href=\"./fastcommit.php\">Ok</a><br>");

		exit;
	}

	$accArr = $accMod->getArray();


	$cssArr = array();
	$jsArr = array("es5-shim.min.js", "common.js");

	include("./view/templates/fastcommit.tpl");
