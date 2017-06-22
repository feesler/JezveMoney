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
			else if ($tr_type == "transfer")
			{
				$tr_dest_acc_id = intval($_POST["dest_acc_id"][$tr_key]);
				echo("Destination account: ".$tr_dest_acc_id."<br>");
				$dest_curr_id = $accMod->getCurrency($tr_dest_acc_id);
				echo("Currency: ".$dest_curr_id." ".Currency::getName($dest_curr_id)."<br>");
				if ($dest_curr_id != $curr_id)
				{
					$tr_dest_amount = floatval($_POST["dest_amount"][$tr_key]);
				}
				else
				{
					$tr_dest_amount = $tr_amount;
				}
				echo("Destination amount: ".$tr_dest_amount."<br>");

				$trans_id = $trMod->create(TRANSFER, $acc_id, $tr_dest_acc_id, $tr_amount, $tr_dest_amount, $curr_id, $dest_curr_id, $tr_date, $tr_comment);
			}
			else
			{
				die("Wrong transaction type");
			}

			if ($trans_id == 0)
				die("Fail to create transaction<br>");
			else
				echo("New transaction id: ".$trans_id."<br>");
			echo("<br>");
		}

		echo("<a href=\"./fastcommit.php\">Ok</a><br>");

		exit;
	}

	$accArr = $accMod->getArray();


	$cssArr = array();
	$jsArr = array("es5-shim.min.js", "common.js", "app.js");

	include("./view/templates/fastcommit.tpl");
