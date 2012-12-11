	<tr>
	<td class="submenu">
<?php
	function isInArray($arr)
	{
		global $ruri;

		if (!is_array($arr))
			return FALSE;

		foreach($arr as $key => $value)
		{
			if (!strncmp($ruri, $dir.$value, strlen($dir.$value)))
				return TRUE;
		}

		return FALSE;
	}


	function showSubMenu($arr)
	{
		global $ruri;

		if (!is_array($arr))
			return;

		foreach($arr as $key => $value)
		{
			echo("<span>");
			if (!strncmp($ruri, $dir.$value, strlen($dir.$value)))
				echo("<b>".$key."</b>");
			else
				echo("<a href=\"./".$value."\">".$key."</a>");
			echo("</span>");
		}
	}


	$subMenuArr = array("Spend" => "expense.php", "Income" => "income.php", "Transfer" => "transfer.php");

	if (isInArray($subMenuArr))
		showSubMenu(($subMenuArr);

?>
	</td>
	</tr>