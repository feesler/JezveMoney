<?php
	$newTransArr = array(array(1, "Spend", "newtransaction.php?type=expense"),
						array(2, "Income", "newtransaction.php?type=income"),
						array(3, "Transfer", "newtransaction.php?type=transfer"));

	function showSubMenu($arr)
	{
		global $ruri;
		global $trans_type;

		if (!is_array($arr))
			return;

		setTab(1);
		html("<tr>");
		html("<td class=\"submenu\">");

		$t_str = "";
		foreach($arr as $trTypeArr)
		{
			$t_str .= "<span>";
			if ($trans_type == $trTypeArr[0])
				$t_str .= "<b>".$trTypeArr[1]."</b>";
			else
				$t_str .= "<a href=\"./".$trTypeArr[2]."\">".$trTypeArr[1]."</a>";
			$t_str .= "</span>";
		}

		setTab(2);
		html($t_str);

		setTab(1);
		html("</td>");
		html("</tr>");
		html();
	}
?>
