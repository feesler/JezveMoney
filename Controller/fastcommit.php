<?php

class FastCommitController extends Controller
{
	public function index()
	{
		global $user_id;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->commit();
			return;
		}

		$accMod = new AccountModel($user_id, FALSE);
		$accArr = $accMod->getArray();
		$currArr = CurrencyModel::getArray();
		$pMod = new PersonModel($user_id);
		$persArr = $pMod->getArray();

		$this->css->page = "fastcommit.css";
		$this->buildCSS();
		array_push($this->jsArr, "dragndrop.js", "sortable.js", "fastcommit.js");

		include("./view/templates/fastcommit.tpl");
	}


	public function commit()
	{
		global $user_id;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
			return;

		header("Content-type: text/html; charset=utf-8");

		$accMod = new AccountModel($user_id, FALSE);
		$trMod = new TransactionModel($user_id);
		$debtMod = new DebtModel($user_id);
		$pMod = new PersonModel($user_id);

		$acc_id = intval($_POST["acc_id"]);
		echo("Account: ".$acc_id." ".$accMod->getName($acc_id)."<br>");
		$curr_id = $accMod->getCurrency($acc_id);
		echo("Currency: ".$curr_id." ".CurrencyModel::getName($curr_id)."<br><br>");
		foreach($_POST["tr_type"] AS $tr_key => $tr_type)
		{
			$tr_amount = floatval($_POST["amount"][$tr_key]);

			$tr_time = strtotime($_POST["date"][$tr_key]);
			if ($tr_time == -1)
			{
				echo("Wrong date format: ".$_POST["date"][$tr_key]);
				break;
			}

			$tr_date =  date("Y-m-d H:i:s", $tr_time);
			$tr_comment = $_POST["comment"][$tr_key];
			echo("Transaction #".$tr_key." : ".$tr_type."<br>");

			if ($tr_type == "expense")
			{
				$tr_dest_curr_id = intval($_POST["curr_id"][$tr_key]);
				if ($tr_dest_curr_id != $curr_id)
				{
					$tr_dest_amount = floatval($_POST["dest_amount"][$tr_key]);
				}
				else
				{
					$tr_dest_amount = $tr_amount;
				}

				echo("src_amount: ".$tr_amount."; dest_amount: ".$tr_dest_amount."; src_curr: ".$curr_id."; dest_curr ".$tr_dest_curr_id);
				echo("; ".$tr_date." ".$tr_comment."<br>");

				$trans_id = $trMod->create(EXPENSE, $acc_id, 0, $tr_amount, $tr_dest_amount, $curr_id, $tr_dest_curr_id, $tr_date, $tr_comment);
			}
			else if ($tr_type == "income")
			{
				$tr_src_curr_id = intval($_POST["curr_id"][$tr_key]);
				if ($tr_src_curr_id != $curr_id)
				{
					$tr_src_amount = floatval($_POST["dest_amount"][$tr_key]);
				}
				else
				{
					$tr_src_amount = $tr_amount;
				}
				echo("src_amount: ".$tr_src_amount."; dest_amount: ".$tr_amount."; src_curr: ".$tr_src_curr_id."; dest_curr ".$curr_id);
				echo("; ".$tr_date." ".$tr_comment."<br>");

				$trans_id = $trMod->create(INCOME, 0, $acc_id, $tr_src_amount, $tr_amount, $tr_src_curr_id, $curr_id, $tr_date, $tr_comment);
			}
			else if ($tr_type == "transferfrom" || $tr_type == "transferto")
			{
				if ($tr_type == "transferfrom")
				{
					$tr_src_acc_id = $acc_id;
					$tr_src_curr_id = $curr_id;
					$tr_dest_acc_id = intval($_POST["dest_acc_id"][$tr_key]);
					$tr_dest_curr_id = $accMod->getCurrency($tr_dest_acc_id);
					$tr_src_amount = $tr_amount;
					$tr_dest_amount = ($tr_dest_curr_id != $tr_src_curr_id) ? floatval($_POST["dest_amount"][$tr_key]) : $tr_amount;

					echo("Dest account: ".$tr_dest_acc_id." ".$accMod->getName($tr_dest_acc_id)."<br>");
				}
				else
				{
					$tr_src_acc_id = intval($_POST["dest_acc_id"][$tr_key]);
					$tr_src_curr_id = $accMod->getCurrency($tr_src_acc_id);
					$tr_dest_acc_id = $acc_id;
					$tr_dest_curr_id = $curr_id;
					$tr_src_amount = ($tr_dest_curr_id != $tr_src_curr_id) ? floatval($_POST["dest_amount"][$tr_key]) : $tr_amount;
					$tr_dest_amount = $tr_amount;

					echo("Source account: ".$tr_src_acc_id." ".$accMod->getName($tr_src_acc_id)."<br>");
				}

				echo("src_amount: ".$tr_src_amount."; dest_amount: ".$tr_dest_amount."; src_curr: ".$tr_src_curr_id."; dest_curr ".$tr_dest_curr_id);
				echo("; ".$tr_date." ".$tr_comment."<br>");

				$trans_id = $trMod->create(TRANSFER,
											$tr_src_acc_id, $tr_dest_acc_id,
											$tr_src_amount, $tr_dest_amount,
											$tr_src_curr_id, $tr_dest_curr_id,
											$tr_date, $tr_comment);
			}
			else if ($tr_type == "debtfrom" || $tr_type == "debtto")
			{
				$op = ($tr_type == "debtfrom") ? 2 : 1;
				$person_id = intval($_POST["person_id"][$tr_key]);
				$tr_src_amount = $tr_dest_amount = $tr_amount;
				$tr_src_curr_id = $tr_dest_curr_id = $curr_id;

				echo(($op ? "give" : "take")."; person: ".$person_id." ".$pMod->getName($person_id)."<br>");

				$trans_id = $debtMod->create($op, $acc_id, $person_id,
									$tr_src_amount, $tr_dest_amount,
									$tr_src_curr_id, $tr_dest_curr_id,
									$tr_date, $tr_comment);
			}
			else
			{
				echo("Wrong transaction type<br>");
				break;
			}

			if ($trans_id == 0)
			{
				echo("Fail to create transaction<br>");
				break;
			}
			else
				echo("New transaction id: ".$trans_id."<br>");
			echo("<br>");
		}

		echo("<a href=\"".BASEURL."fastcommit/\">Ok</a><br>");
	}
}
