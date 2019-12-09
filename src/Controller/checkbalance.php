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


		$accMod = new AccountModel($this->user_id);

		$initBalance = [];
		$curBalance = [];
		$realBalance = [];
		$accName = [];

		$accArr = $accMod->getData([ "full" => TRUE ]);
		foreach($accArr as $item)
		{
			$initBalance[$item->id] = $item->initbalance;
			$curBalance[$item->id] = $item->balance;
			$accName[$item->id] = $accMod->getNameOrPerson($item->id);

			$realBalance[$item->id] = $initBalance[$item->id];
		}

		$prev_date = 0;

		$condArr = ["user_id=".$this->user_id];
		if ($checkAccount_id != 0)
		{
			$accCond = ["(src_id=".$checkAccount_id." AND (type=".EXPENSE." OR type=".TRANSFER." OR type=".DEBT."))",
							"(dest_id=".$checkAccount_id." AND (type=".INCOME." OR type=".TRANSFER." OR type=".DEBT."))"];

			$condArr[] = "(".orJoin($accCond).")";
		}

		$qResult = $db->selectQ("*", "transactions", $condArr, NULL, "pos");
		$transArr = [];
		while($row = $db->fetchRow($qResult))
		{
			$tr_id = intval($row["id"]);
			$tr = ["type" => intval($row["type"]),
						"src_id" => intval($row["src_id"]),
						"dest_id" => intval($row["dest_id"]),
						"src_amount" => floatval($row["src_amount"]),
						"dest_amount" => floatval($row["dest_amount"]),
						"src_result" => floatval($row["src_result"]),
						"dest_result" => floatval($row["dest_result"]),
						"comment" => $row["comment"],
						"date" => strtotime($row["date"]),
						"pos" => intval($row["pos"])];

			unset($row);

			$tr["src_name"] = $tr["src_id"] && isset($accName[$tr["src_id"]]) ? $accName[$tr["src_id"]] : NULL;
			$tr["dest_name"] = $tr["dest_id"] && isset($accName[$tr["dest_id"]]) ? $accName[$tr["dest_id"]] : NULL;

			if ($tr["type"] == EXPENSE)
			{
				if (!isset($realBalance[$tr["src_id"]]))
					$realBalance[$tr["src_id"]] = $tr["src_result"];

				$realBalance[$tr["src_id"]] = round($realBalance[$tr["src_id"]] - $tr["src_amount"], 2);
				$tr["realbal"] = [ $tr["src_id"] => $realBalance[$tr["src_id"]] ];
			}
			else if ($tr["type"] == INCOME)
			{
				if (!isset($realBalance[ $tr["dest_id"] ]))
					$realBalance[ $tr["dest_id"] ] = $tr["dest_result"];

				$realBalance[$tr["dest_id"]] = round($realBalance[$tr["dest_id"]] + $tr["dest_amount"], 2);
				$tr["realbal"] = [ $tr["dest_id"] => $realBalance[$tr["dest_id"]] ];
			}
			else if ($checkAccount_id != 0 && $tr["type"] == TRANSFER && $tr["dest_id"] == $checkAccount_id)		/* transfer to */
			{
				$realBalance[ $tr["src_id"] ] = $tr["src_result"];

				$realBalance[$checkAccount_id] = round($realBalance[$checkAccount_id] + $tr["dest_amount"], 2);
				$tr["realbal"] = [ $checkAccount_id => $realBalance[$checkAccount_id],
									$tr["src_id"] => $realBalance[ $tr["src_id"] ] ];
			}
			else if ($checkAccount_id != 0 && $tr["type"] == TRANSFER && $tr["src_id"] == $checkAccount_id)		/* transfer from */
			{
				$realBalance[ $tr["dest_id"] ] = $tr["dest_result"];

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
						$realBalance[$tr["src_id"]] = $tr["src_result"];
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
						$realBalance[$tr["dest_id"]] = $tr["dest_result"];
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
		array_push($this->jsArr, "lib/raphael.min.js", "charts.js", "checkbalance.js");

		if (isset($_GET["tr"]))
		{
			echo("var transactions = ".f_json_encode($transArr).";");
			exit;
		}
		else
			include("./view/templates/checkbalance.tpl");
	}
}
