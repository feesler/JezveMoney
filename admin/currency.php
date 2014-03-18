<?php
	require_once("../setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id || !$u->isAdmin($user_id))
		setLocation("../login.php");

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html("<meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\">");
	html("<title>Admin panel | Currency</title>");
	html("<script type=\"text/javascript\" src=\"../js/common.js\"></script>");
	html("<script>");

	html(Currency::getArray(TRUE));
?>

function findCurrency(id)
{
	var found = null;

	if (id != 0 && currency)
	{
		currency.some(function(curr)
		{
			if (curr[0] == id)
				found = curr;

			return (curr[0] == id);
		});
	}

	return found;
}


function setCurrencyValues(currObj)
{
	var curr_id, del_curr_id, curr_name, curr_sign, curr_format;

	curr_id = ge('curr_id');
	del_curr_id = ge('del_curr_id');
	curr_name = ge('curr_name');
	curr_sign = ge('curr_sign');
	curr_format = ge('curr_format');
	if (!curr_id || !del_curr_id || !curr_name || !curr_sign || !curr_format)
		return;

	if (currObj)
	{
		curr_id.value = currObj[0];
		del_curr_id.value = currObj[0];
		curr_name.value = currObj[1];
		curr_sign.value = currObj[2];
		curr_format.checked = (currObj[3] == 1);
	}
	else			// clean
	{
		curr_id.value = '';
		curr_id.value = '';
		curr_name.value = '';
		curr_sign.value = '';
		curr_format.checked = false;
	}
}


function selectCurrency(id)
{
	var curr_frm, currObj;

	curr_frm = ge('curr_frm');
	if (!curr_frm)
		return;

	currObj = findCurrency(id);
	if (currObj)
	{
		curr_frm.action = '../modules/editcurrency.php';
		setCurrencyValues(currObj);
		show('del_btn', true);
	}
	else			// clean
	{
		setCurrencyValues(null);
	}
}


function onSelectCurrency(id)
{
	selectCurrency(id);
	selectByValue(ge('curr_sel'), id);
}


function onCurrSel()
{
	var curr_sel;

	curr_sel = ge('curr_sel');
	if (!curr_sel)
		return;

	selectCurrency(selectedValue(curr_sel))
}


function newCurr()
{
	var curr_frm;

	curr_frm = ge('curr_frm');
	if (!curr_frm)
		return;

	curr_frm.action = '../modules/createcurrency.php';
	setCurrencyValues(null);

	show('del_btn', false);
}


function onDeleteSubmit(frm)
{
	return confirm('Are you sure want to delete selected currency?');
}
<?php
	html("</script>");
	html("</head>");
	html("<body>");
	html("<a href=\"./index.php\">Admin</a><br>");
	html("<b>Currencies</b> <a href=\"./query.php\">Queries</a>");

	if (isset($_GET["add"]))
	{
		if ($_GET["add"] == "ok")
			html("<span style=\"color: green;\">Currency was succussfully created</span><br>");
		else if ($_GET["add"] == "fail")
			html("<span style=\"color: red;\">Fail to create new currency</span><br>");
	}
	else 	if (isset($_GET["edit"]))
	{
		if ($_GET["edit"] == "ok")
			html("<span style=\"color: green;\">Currency was succussfully updated</span><br>");
		else if ($_GET["edit"] == "fail")
			html("<span style=\"color: red;\">Fail to update new currency</span><br>");
	}
	else 	if (isset($_GET["del"]))
	{
		if ($_GET["del"] == "ok")
			html("<span style=\"color: green;\">Currency was succussfully deleted</span><br>");
		else if ($_GET["del"] == "fail")
			html("<span style=\"color: red;\">Fail to delete new currency</span><br>");
	}

	html("<table>");
	html("<thead>");
	html("<tr><td>id</td><td>name</td><td>sign</td><td>format</td><td></td></tr>");
	html("</thead>");

	html("<tbody>");
	$resArr = $db->selectQ("*", "currency");
	forEach($resArr as $row)
	{
		html("<tr><td>".$row["id"]."</td><td>".$row["name"]."</td><td>".$row["sign"]."</td><td>".$row["format"]."</td><td><input type=\"button\" value=\"select\" onclick=\"onSelectCurrency(".$row["id"].");\"></td></tr>");
	}
	html("</tbody>");
	html("</table>");

	html("<select id=\"curr_sel\" onchange=\"onCurrSel()\">");
	html("<option value=\"0\"></option>");
	echo(Currency::getList());
	html("</select>");

	html("<input type=\"button\" value=\"new\" onclick=\"newCurr()\">");

	html("<form method=\"post\" action=\"../modules/delcurrency.php\" onsubmit=\"return onDeleteSubmit(this);\">");
	html("<input id=\"del_curr_id\" name=\"curr_id\" type=\"hidden\">");
	html("<div id=\"del_btn\" style=\"display: none;\"><input type=\"submit\" value=\"delete\"></div>");
	html("</form>");

	html("<form id=\"curr_frm\" method=\"post\" action=\"../modules/createcurrency.php\">");
	html("<input id=\"curr_id\" name=\"curr_id\" type=\"hidden\"><br>");
	html("<label for=\"curr_name\">name</label><br><input id=\"curr_name\" name=\"curr_name\" type=\"text\"><br>");
	html("<label for=\"curr_sign\">sign</label><br><input id=\"curr_sign\" name=\"curr_sign\" type=\"text\"><br>");
	html("<input id=\"curr_format\" name=\"curr_format\" type=\"checkbox\"><label for=\"curr_format\">sign before value</label><br>");
	html("<input type=\"submit\" value=\"ok\">");
	html("</form>");

	html("</body>");
	html("</html>");
	
?>