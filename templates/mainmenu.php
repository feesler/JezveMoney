<?php
	function getMainMenu()
	{
		global $ruri;

		$menuArr = array("Main" => "index.php",
						"Accounts" => "accounts.php",
						"Transactions" => "transactions.php",
						"Statistics" => "statistics.php");
		$dir = "/money/";

		$resStr = "";
		foreach($menuArr as $key => $value)
		{
			$resStr .= "<span>";

			if (!strncmp($ruri, $dir.$value, strlen($dir.$value)))
				$resStr .= "<b>".$key."</b>";
			else
				$resStr .= "<a href=\"./".$value."\">".$key."</a>";

			$resStr .= "</span>";
		}

		return $resStr;
	}

	html("<tr>");
	html("<td class=\"mainmenu\">".getMainMenu()."</td>");
	html("</tr>");
?>