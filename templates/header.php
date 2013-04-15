<?php
html("<div class=\"header\">");
pushTab();
html("<div class=\"logo\"><a href=\"./index.php\"><span>Jezve Money</span></a></div>");

if ($user_id != 0)
{
html("<div class=\"userblock\">");
pushTab();
html("<button onclick=\"onUserClick()\"><span>".(User::getName($user_id))."</span></button>");
html("<div id=\"menupopup\" class=\"usermenu\" style=\"display: none;\">");
pushTab();
html("<ul>");
pushTab();
html("<li><a href=\"#\">profile</a></li>");
html("<li><a href=\"#\">logout</a></li>");
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