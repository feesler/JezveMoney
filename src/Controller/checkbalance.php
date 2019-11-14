<?php

class CheckBalanceController extends Controller
{
	public function fail()
	{
		echo "fail";
		exit;
	}


	public function index()
	{
		global $user_id, $user_name, $uMod;

ini_set('max_execution_time', '0');

		$db = mysqlDB::getInstance();

		if (is_null($this->actionParam) || $this->actionParam == "all")
		{
			$checkAccount_id = 0;
		}
		else
		{
			$checkAccount_id = intval($this->actionParam);
			if (!$checkAccount_id)
				fail();
		}

		$fixed = FALSE;

		if (isset($_GET["act"]) && $_GET["act"] == "fix" && $checkAccount_id != 0)
		{
			if (isset($_POST["fixbal"]))
			{
				$fixbal = floatval($_POST["fixbal"]);

				if (!$db->updateQ("accounts", ["balance"], [$fixbal], "id=".$checkAccount_id))
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


		$trMod = new TransactionModel($user_id);
		$accMod = new AccountModel($user_id, TRUE);

		$condArr = ["user_id=".$user_id];
		if ($checkAccount_id != 0)
			$condArr[] = "id=".$checkAccount_id;
		$resArr = $db->selectQ("*", "accounts", $condArr);
		if (count($resArr) == 0)
			fail();

		$initBalance = [];
		$curBalance = [];
		$realBalance = [];
		$accName = [];
		foreach($resArr as $row)
		{
			$acc_id = intval($row["id"]);
			$initBalance[$acc_id] = floatval($row["initbalance"]);
			$curBalance[$acc_id] = floatval($row["balance"]);
			$accName[$acc_id] = $accMod->getNameOrPerson($acc_id);

			$realBalance[$acc_id] = $initBalance[$acc_id];
		}


		$accNameCache = [];

		$prev_date = 0;

		$condArr = ["user_id=".$user_id];
		if ($checkAccount_id != 0)
		{
			$accCond = ["(src_id=".$checkAccount_id." AND (type=1 OR type=3 OR type=4))",
							"(dest_id=".$checkAccount_id." AND (type=2 OR type=3 OR type=4))"];

			$condArr[] = "(".orJoin($accCond).")";
		}

		$resArr = $db->selectQ("*", "transactions", $condArr, NULL, "pos");
		$transArr = [];
		foreach($resArr as $row)
		{
			$tr_id = intval($row["id"]);
			$tr = ["type"=> intval($row["type"]),
						"src_id"=> intval($row["src_id"]),
						"dest_id"=> intval($row["dest_id"]),
						"src_amount"=> floatval($row["src_amount"]),
						"dest_amount"=> floatval($row["dest_amount"]),
						"comment"=> $row["comment"],
						"date"=> strtotime($row["date"]),
						"pos" => intval($row["pos"])];

			$tr["src_name"] = $accMod->getNameOrPerson($tr["src_id"]);
			$tr["dest_name"] = $accMod->getNameOrPerson($tr["dest_id"]);

			if ($tr["type"] == EXPENSE)
			{
				if (!isset($realBalance[$tr["src_id"]]))
					$realBalance[$tr["src_id"]] = $trMod->getSrcResult($tr_id);

				$realBalance[$tr["src_id"]] = round($realBalance[$tr["src_id"]] - $tr["src_amount"], 2);
				$tr["realbal"] = [ $tr["src_id"] => $realBalance[$tr["src_id"]] ];
			}
			else if ($tr["type"] == INCOME)
			{
				if (!isset($realBalance[ $tr["dest_id"] ]))
					$realBalance[ $tr["dest_id"] ] = $trMod->getDestResult($tr_id);

				$realBalance[$tr["dest_id"]] = round($realBalance[$tr["dest_id"]] + $tr["dest_amount"], 2);
				$tr["realbal"] = [ $tr["dest_id"] => $realBalance[$tr["dest_id"]] ];
			}
			else if ($checkAccount_id != 0 && $tr["type"] == TRANSFER && $tr["dest_id"] == $checkAccount_id)		/* transfer to */
			{
				$realBalance[ $tr["src_id"] ] = $trMod->getSrcResult($tr_id);

				$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] + $tr["dest_amount"], 2);
				$tr["realbal"] = [ $checkAccount_id => $realBalance[$checkAccount_id],
									$tr["src_id"] => $realBalance[ $tr["src_id"] ] ];
			}
			else if ($checkAccount_id != 0 && $tr["type"] == TRANSFER && $tr["src_id"] == $checkAccount_id)		/* transfer from */
			{
				$realBalance[ $tr["dest_id"] ] = $trMod->getDestResult($tr_id);

				$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] - $tr["src_amount"], 2);
				$tr["realbal"] = [ $checkAccount_id => $realBalance[$checkAccount_id],
									$tr["dest_id"] => $realBalance[ $tr["dest_id"] ] ];
			}
			else if ($checkAccount_id == 0 && $tr["type"] == TRANSFER)		/* Transfer between two accounts */
			{
				$realBalance[$tr["src_id"]] = round($realBalance[$tr["src_id"]] - $tr["src_amount"], 2);
				$realBalance[$tr["dest_id"]] = round($realBalance[$tr["dest_id"]] + $tr["dest_amount"], 2);
				$tr["realbal"] = [ $tr["src_id"] => $realBalance[$tr["src_id"]],
									$tr["dest_id"] => $realBalance[$tr["dest_id"]] ];
			}
			else if ($tr["type"] == DEBT)
			{
				$tr["realbal"] = [];

				if ($tr["src_id"] != 0)
				{
					if ($tr["src_id"] == $checkAccount_id || $checkAccount_id == 0)
					{
						$realBalance[$tr["src_id"]] = round($realBalance[$tr["src_id"]] - $tr["src_amount"], 2);
					}
					else
					{
						$realBalance[$tr["src_id"]] = $trMod->getSrcResult($tr_id);
					}

					$tr["realbal"][$tr["src_id"]] = $realBalance[$tr["src_id"]];
				}
				if ($tr["dest_id"] != 0)
				{
					if ($tr["dest_id"] == $checkAccount_id || $checkAccount_id == 0)
					{
						$realBalance[$tr["dest_id"]] = round($realBalance[$tr["dest_id"]] + $tr["dest_amount"], 2);
					}
					else
					{
						$realBalance[$tr["dest_id"]] = $trMod->getDestResult($tr_id);
					}

					$tr["realbal"][$tr["dest_id"]] = $realBalance[$tr["dest_id"]];
				}
			}

			$tr["correctdate"] = ($tr["date"] >= $prev_date);
			if ($tr["correctdate"])
				$prev_date = $tr["date"];
			$tr["datefmt"] = date("d.m.Y", $tr["date"]);

			$transArr[$tr_id] = $tr;
		}


		$balanceDiff = [];
		foreach($realBalance as $acc_id => $rbrow)
		{
			if (!isset($curBalance[$acc_id]))
				$curBalance[$acc_id] = 0;

			$balanceDiff[$acc_id] = round($rbrow - $curBalance[$acc_id], 2);
		}


		$titleString = "Jezve Money | Check balance";

		array_push($this->css->libs, "charts.css");
		$this->buildCSS();
		array_push($this->jsArr, "lib/raphael.min.js", "charts.js");

		if (isset($_GET["tr"]))
		{
			echo("var transactions = ".f_json_encode($transArr).";");
			exit;
		}
		else
			include("./view/templates/checkbalance.tpl");
	}
}
