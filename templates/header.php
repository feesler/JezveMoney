<?php
	html_op("<div class=\"header\">");
		html_op("<div>");
			html("<div class=\"logo\"><a href=\"./index.php\"><span>Jezve Money</span></a></div>");

	if ($user_id != 0)
	{
		$owner_id = User::getOwner($user_id);
		$pers = new Person($user_id);
		$owner_name = $pers->getName($owner_id);

		html_op("<div class=\"userblock\">");
			html("<button id=\"userbtn\" class=\"user_button\" onclick=\"onUserClick()\"><div class=\"user_icon\"></div><span>".$owner_name."</span></button>");
			html_op("<div id=\"menupopup\" class=\"usermenu\" style=\"display: none;\">");
				html_op("<ul>");
					html("<li><a href=\"./profile.php\">profile</a></li>");
					html("<li><a href=\"./modules/logout.php\">logout</a></li>");
				html_cl("</ul>");
			html_cl("</div>");
		html_cl("</div>");
	}

		html_cl("</div>");
	html_cl("</div>");

	checkMessage();
?>