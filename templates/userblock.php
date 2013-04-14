<?php
	html("<tr>");
	html("<td class=\"userblock\">");
	html("<form id=\"logoutfrm\" name=\"logoutfrm\" method=\"post\" action=\"./modules/logout.php\">");
	html("<span style=\"margin-right: 20px;\"><b><a href=\"./profile.php\">".User::getName($userid)."</a></b> logged in</span><input type=\"submit\" value=\"Logout\">");
	html("</form>");
	html("</td>");
	html("</tr>");
?>