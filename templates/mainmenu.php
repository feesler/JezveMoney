	<tr>
	<td class="mainmenu">
<?php
	$menuArr = array("Main" => "index.php",
					"Accounts" => "accounts.php",
					"Transactions" => "transactions.php",
					"Statistics" => "statistics.php");
	$dir = "/money/";

	foreach($menuArr as $key => $value)
	{
		if (!strncmp($ruri, $dir.$value, strlen($dir.$value)))
		{
			echo("<span><b>".$key."</b></span>");
		}
		else
		{
			echo("<span><a href=\"./".$value."\">".$key."</a></span>");
		}
	}
?>
	</td>
	</tr>