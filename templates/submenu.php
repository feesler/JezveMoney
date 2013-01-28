<?php
	html("<tr>");
	html("<td class=\"submenu\">");

	$subMenuArr = array(array(1, "Spend", "newtransaction.php?type=expense"),
						array(2, "Income", "newtransaction.php?type=income"),
						array(3, "Transfer", "newtransaction.php?type=transfer"));

	function showSubMenu($arr)
	{
		global $ruri;
		global $trans_type;

		if (!is_array($arr))
			return;

		foreach($arr as $trTypeArr)
		{
			echo("<span>");
			if ($trans_type == $trTypeArr[0])
				echo("<b>".$trTypeArr[1]."</b>");
			else
				echo("<a href=\"./".$trTypeArr[2]."\">".$trTypeArr[1]."</a>");
			echo("</span>");
		}
	}

	showSubMenu($subMenuArr);

	html();
	html("</td>");
	html("</tr>");
?>
