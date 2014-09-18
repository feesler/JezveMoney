<?php
	require_once("../setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id || !$u->isAdmin($user_id))
		setLocation("../login.php");
?>
<!DOCTYPE html>
<html>
<head>
<title>Admin panel</title>
<script type="text/javascript" src="../js/common.js"></script>
<script type="text/javascript" src="../js/ajax.js"></script>
<script>
function onFormSubmit(obj)
{
	var link, els = {}, params;

	if (!obj || !obj.elements)
		return false;

	for(i = 0; i < obj.elements.length; i++)
	{
		if (!obj.elements[i].disabled && obj.elements[i].name != '')
			els[obj.elements[i].name] = obj.elements[i].value;
	}

	if (obj.method == 'get')
	{
		params = urlJoin(els);
		link = obj.action;
		if (params != '')
			link += ((link.indexOf('?') != -1) ? '&' : '?') + params;
		getData(link, ajaxCallback);
	}
	else if (obj.method == 'post')
	{
		params = urlJoin(els);
		link = obj.action;
		postData(link, params, ajaxCallback);
	}

	return false;
}


function ajaxCallback(text)
{
	var results;

	results = ge('results');
	if (!results)
		return;

	results.innerHTML = text;
}


function onCheck(obj, elName)
{
	var frm, el;

	if (!obj || !obj.form || !elName)
		return;

	frm = obj.form;
	if (frm.elements[elName])
	{
		el = frm.elements[elName];
		el.disabled = !obj.checked;
	}
}
</script>
<style>
.test_container
{
	background-color: #DDDDFF;
	max-width: 400px;
	display: inline-block;
	float: left;
	margin: 0px 20px 20px 0px;
}


.test_result
{
	clear: both;
	float: none;
	display: block;
}


h2
{
	font-family: "Segoe UI", Arial, sanf-serif;
	font-size: 22px;
	font-weight: normal;
	clear: both;
}
</style>
</head>
<body>
<b>Admin</b><br>
<a href="./currency.php">Currencies</a> <a href="./query.php">Queries</a> <a href="./log.php">Logs</a> <b> API test</b>
<div>
	<h2>Accounts</h2>

	<div class="test_container">
	Get accounts
	<form action="../api/getAccounts.php" method="get" onsubmit="return onFormSubmit(this);">
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Read account
	<form action="../api/account.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
		<label for="accid">Id</label>
		<input name="accid" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Create account
	<form action="../api/account.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
		<label for="accname">Name</label>
		<input name="accname" type="text"><br>
		<label for="balance">Balance</label>
		<input name="balance" type="text"><br>
		<label for="currency">Currency (1-5, 10-22)</label>
		<input name="currency" type="text"><br>
		<label for="icon">Icon (1-6; 0 - no icon)</label>
		<input name="icon" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Edit account
	<form action="../api/account.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
		<label for="accid">Id</label>
		<input name="accid" type="text"><br>
		<label for="accname">Name</label>
		<input name="accname" type="text"><br>
		<label for="balance">Balance</label>
		<input name="balance" type="text"><br>
		<label for="currency">Currency (1-5, 10-22)</label>
		<input name="currency" type="text"><br>
		<label for="icon">Icon (1-6; 0 - no icon)</label>
		<input name="icon" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Delete account
	<form action="../api/account.php?act=del" method="post" onsubmit="return onFormSubmit(this);">
		<label for="accounts">Accounts (comma separated ids)</label>
		<input name="accounts" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Reset accounts
	<form action="../api/account.php?act=reset" method="post" onsubmit="return onFormSubmit(this);">
		<input type="submit" value="submit">
	</form>
	</div>

	<h2>Transactions</h2>

	<div class="test_container">
	Get transactions
	<form action="../api/getTransactions.php" method="get" onsubmit="return onFormSubmit(this);">
		<input type="checkbox" onchange="onCheck(this, 'count');"><label for="count">Max. count</label>
		<input name="count" type="text" value="10" disabled><br>
		<input type="checkbox" onchange="onCheck(this, 'page');"><label for="page">Page number</label>
		<input name="page" type="text" value="0" disabled><br>
		<input type="checkbox" onchange="onCheck(this, 'acc_id');"><label for="acc_id">Account id (0 for all accounts)</label>
		<input name="acc_id" type="text" value="0" disabled><br>
		<input type="checkbox" onchange="onCheck(this, 'stdate');"><label for="stdate">Start date</label>
		<input name="stdate" type="text" value="" disabled><br>
		<input type="checkbox" onchange="onCheck(this, 'enddate');"><label for="enddate">End date</label>
		<input name="enddate" type="text" value="" disabled><br>
		<input type="checkbox" onchange="onCheck(this, 'search');"><label for="search">Search request</label>
		<input name="search" type="text" value="" disabled><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Read transaction
	<form action="../api/transaction.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
		<label for="transid">Id</label>
		<input name="transid" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Create transaction
	<form action="../api/transaction.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
		<label for="transtype">Type (1-3)</label>
		<input name="transtype" type="text"><br>

		<label for="src_id">Source account</label>
		<input name="src_id" type="text"><br>
		<label for="dest_id">Destination account</label>
		<input name="dest_id" type="text"><br>

		<label for="src_amount">Source amount</label>
		<input name="src_amount" type="text"><br>
		<label for="dest_amount">Destination amount</label>
		<input name="dest_amount" type="text"><br>

		<label for="src_curr">Source currency</label>
		<input name="src_curr" type="text"><br>
		<label for="dest_curr">Destination currency</label>
		<input name="dest_curr" type="text"><br>

		<label for="date">Date</label>
		<input name="date" type="text"><br>

		<label for="comm">Comment</label>
		<input name="comm" type="text"><br>

		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Create debt
	<form action="../api/transaction.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
		<input name="transtype" type="hidden" value="4">
		<label for="person_id">Person id</label>
		<input name="person_id" type="text"><br>
		<label for="acc_id">Account id</label>
		<input name="acc_id" type="text"><br>
		<label for="debtop">Debt operation (1 or 2)</label>
		<input name="debtop" type="text"><br>

		<label for="src_amount">Source amount</label>
		<input name="src_amount" type="text"><br>
		<label for="dest_amount">Destination amount</label>
		<input name="dest_amount" type="text"><br>

		<label for="src_curr">Source currency</label>
		<input name="src_curr" type="text"><br>
		<label for="dest_curr">Destination currency</label>
		<input name="dest_curr" type="text"><br>

		<label for="date">Date</label>
		<input name="date" type="text"><br>

		<label for="comm">Comment</label>
		<input name="comm" type="text"><br>

		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Edit transaction
	<form action="../api/transaction.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
		<label for="transid">Transaction id</label>
		<input name="transid" type="text"><br>

		<label for="transtype">Type (1-3)</label>
		<input name="transtype" type="text"><br>

		<label for="src_id">Source account</label>
		<input name="src_id" type="text"><br>
		<label for="dest_id">Destination account</label>
		<input name="dest_id" type="text"><br>

		<label for="src_amount">Source amount</label>
		<input name="src_amount" type="text"><br>
		<label for="dest_amount">Destination amount</label>
		<input name="dest_amount" type="text"><br>

		<label for="src_curr">Source currency</label>
		<input name="src_curr" type="text"><br>
		<label for="dest_curr">Destination currency</label>
		<input name="dest_curr" type="text"><br>

		<label for="date">Date</label>
		<input name="date" type="text"><br>

		<label for="comm">Comment</label>
		<input name="comm" type="text"><br>

		<input type="submit" value="submit">
	</form>
	</div>


	<div class="test_container">
	Edit debt
	<form action="../api/transaction.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
		<label for="transid">Transaction id</label>
		<input name="transid" type="text"><br>

		<input name="transtype" type="hidden" value="4">

		<label for="person_id">Person id</label>
		<input name="person_id" type="text"><br>
		<label for="acc_id">Account id</label>
		<input name="acc_id" type="text"><br>
		<label for="debtop">Debt operation (1 or 2)</label>
		<input name="debtop" type="text"><br>

		<label for="src_amount">Source amount</label>
		<input name="src_amount" type="text"><br>
		<label for="dest_amount">Destination amount</label>
		<input name="dest_amount" type="text"><br>

		<label for="src_curr">Source currency</label>
		<input name="src_curr" type="text"><br>
		<label for="dest_curr">Destination currency</label>
		<input name="dest_curr" type="text"><br>

		<label for="date">Date</label>
		<input name="date" type="text"><br>

		<label for="comm">Comment</label>
		<input name="comm" type="text"><br>

		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Delete account
	<form action="../api/transaction.php?act=del" method="post" onsubmit="return onFormSubmit(this);">
		<label for="transactions">Transactions (comma separated ids)</label>
		<input name="transactions" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<h2>Persons</h2>

	<div class="test_container">
	Get persons
	<form action="../api/person.php?act=list" method="get" onsubmit="return onFormSubmit(this);">
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Read person
	<form action="../api/person.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
		<label for="pid">Id</label>
		<input name="pid" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Create person
	<form action="../api/person.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
		<label for="pname">Name</label>
		<input name="pname" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Edit person
	<form action="../api/person.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
		<label for="pid">Id</label>
		<input name="pid" type="text"><br>
		<label for="pname">Name</label>
		<input name="pname" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Delete persons
	<form action="../api/person.php?act=del" method="post" onsubmit="return onFormSubmit(this);">
		<label for="persons">Persons (comma separated ids)</label>
		<input name="persons" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<h2>Currency</h2>

	<div class="test_container">
	Get currencies
	<form action="../api/currency.php?act=list" method="get" onsubmit="return onFormSubmit(this);">
		<input type="submit" value="submit">
	</form>
	</div>

	<div class="test_container">
	Read currency
	<form action="../api/currency.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
		<label for="curr_id">Id</label>
		<input name="curr_id" type="text"><br>
		<input type="submit" value="submit">
	</form>
	</div>

	<div id="results" class="test_result">
	</div>
</div>
</body>
</html>
