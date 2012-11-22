	<tr>
	<td class="mainmenu">
<?php
	$ruri = $_SERVER["REQUEST_URI"];

	$menuArr = array("Main" => "index.php", "Accounts" => "accounts.php", "Transactions" => "transactions.php");
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