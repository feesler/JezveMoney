<?php


	// Return currency of account
	function getAccountCurrency($account_id)
	{
		global $db;

		$resArr = $db->selectQ("curr_id", "accounts", "id=".$account_id);

		return ((count($resArr) == 1) ? intval($resArr[0]["curr_id"]) : 0);
	}


	// Return account name
	function getAccountName($account_id)
	{
		global $db;

		$resArr = $db->selectQ("*", "accounts", "id=".intval($account_id));

		return (count($resArr) == 1) ? $resArr[0]["name"] : "";
	}


	// Return HTML string of accounts for select control
	function getAccountsList($user_id, $selected_id = 0)
	{
		global $db;

		$resStr = "";

		$resArr = $db->selectQ("*", "accounts", "user_id=".$user_id);
		foreach($resArr as $row)
		{
			$resStr .= "\t\t\t\t<option value=\"".$row["id"]."\"";
			if (intval($row["id"]) == $selected_id)
				$resStr .= " selected";
			$resStr .= ">".$row["name"]."</option>\r\n";
		}

		return $resStr;
	}



	// Return Javascript array of accounts
	function getAccountsArray($user_id)
	{
		global $db;

		$resStr = "";

		$resArr = $db->selectQ("c.id AS curr_id, c.sign AS sign, a.id AS id, a.balance AS balance", "accounts AS a, currency AS c", "a.user_id=".$user_id." AND c.id=a.curr_id");
		$accounts = count($resArr);
		$resStr .= "var accounts = [";
		foreach($resArr as $i => $row)
		{
			$resStr .= "[".$row["id"].", ".$row["curr_id"].", ".json_encode($row["sign"]).", ".$row["balance"]."]".(($i < $accounts - 1) ? ", " : "];\r\n");
		}

		return $resStr;
	}


	// Return table of accounts of user
	function getAccountsTable($user_id, $transfer = FALSE, $editlink = FALSE)
	{
		global $db;

		$resStr = "";

		$resStr .= "\t<tr>\r\n\t<td>\r\n\t<table class=\"infotable\">\r\n";

		$resArr = $db->selectQ("*", "accounts", "user_id=".$user_id);
		$accounts = count($resArr);
		if ((!$accounts && !$transfer) || ($accounts < 2 && $transfer))
		{
			$resStr .= "\t\t<tr><td><span>";
			if ($transfer)
				$resStr .= "You need at least two accounts to transfer.";
			else
				$resStr .= "You have no one account. Please create one.";
			$resStr .= "</span></td></tr>\r\n";
		}
		else
		{
			$resStr .= "\t\t<tr><td><b>Name</b></td><td><b>Currency</b></td><td><b>Balance</b></td>";
			if ($editlink == TRUE)
				$resStr .= "<td></td>";
			$resStr .= "</tr>\r\n";

			$totalArr = array();
			foreach($resArr as $row)
			{
				$balfmt = currFormat($row["balance"], $row["curr_id"]);
				$currname = getCurrencyName($row["curr_id"]);

				if ($currname != "" && !$totalArr[$row["curr_id"]])
					$totalArr[$row["curr_id"]] = 0;

				$totalArr[$row["curr_id"]] += $row["balance"];

				$resStr .= "\t\t<tr><td>".$row["name"]."</td><td>".$currname."</td><td style=\"text-align: right;\">".$balfmt."</td>";
				if ($editlink == TRUE)
					$resStr .= "<td><a href=\"./editaccount.php?id=".$row["id"]."\">edit</a> <a href=\"./checkbalance.php?id=".$row["id"]."\">check</a></td>";
				$resStr .= "</tr>\r\n";
			}

			$resStr .= "\t\t<tr style=\"background-color: transparent;\">";
			$resStr .= "<td colspan=\"".(($editlink == TRUE) ? "4" : "3")."\" style=\"height: 10px;\"></td></tr>\r\n";

			foreach($totalArr as $key => $value)
			{
				$valfmt = currFormat($value, $key);
				$currname = getCurrencyName($key);
				$resStr .= "<tr><td>Total</td><td>".$currname."</td><td style=\"text-align: right;\">".$valfmt."</td>";
				if ($editlink == TRUE)
					$resStr .= "<td></td>";
				$resStr .= "</tr>";
			}
		}

		$resStr .= "\t</table>\r\n\t</td>\r\n\t</tr>\r\n";

		return $resStr;
	}

?>