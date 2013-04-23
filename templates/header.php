<?php
	html("<div class=\"header\">");
	pushTab();
	html("<div class=\"logo\"><a href=\"./index.php\"><span>Jezve Money</span></a></div>");

	if ($user_id != 0)
	{
		$owner_id = User::getOwner($user_id);
		$pers = new Person($user_id);
		$owner_name = $pers->getName($owner_id);

		html("<div class=\"userblock\">");
		pushTab();
			html("<button id=\"userbtn\" onclick=\"onUserClick()\"><span>".$owner_name."</span></button>");
			html("<div id=\"menupopup\" class=\"usermenu\" style=\"display: none;\">");
			pushTab();
				html("<ul>");
					pushTab();
					html("<li><a href=\"./profile.php\">profile</a></li>");
					html("<li><a href=\"./modules/logout.php\">logout</a></li>");
					popTab();
				html("</ul>");
			popTab();
			html("</div>");
		popTab();
		html("</div>");
	}

	popTab();
	html("</div>");
?>