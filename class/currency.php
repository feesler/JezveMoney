<?php



// Format value in specified currency
function currFormat($value, $curr_id)
{
	global $db;

	$resArr = $db->selectQ("format", "currency", "id=".$curr_id);
	return valFormat((count($resArr) == 1) ? $resArr[0]["format"] : "", $value);
}


// Return currency name
function getCurrencyName($curr_id)
{
	global $db;

	$resArr = $db->selectQ("name", "currency", "id=".$curr_id);

	return ((count($resArr) == 1) ? $resArr[0]["name"] : "");
}


// Return HTML string of currencies for select control
function getCurrencyList($selected_id = 0)
{
	global $db;

	$resStr = "";

	$resArr = $db->selectQ("*", "currency");
	foreach($resArr as $row)
	{
		$resStr .= "\t\t\t<option value=\"".$row["id"]."\"";
		if ($row["id"] == $selected_id)
			$resStr .= " selected";
		$resStr .= ">".$row["name"]."</option>\r\n";
	}

	return $resStr;
}


// Return Javascript array of currencies
function getCurrencyArray()
{
	global $db;

	$resStr = "";

	$resArr = $db->selectQ("id, name, sign", "currency", NULL, NULL, "id");
	$currcount = count($resArr);
	$resStr .= "var currency = [";
	foreach($resArr as $i => $row)
	{
		$resStr .= "[".$row["id"].", ".json_encode($row["name"]).", ".json_encode($row["sign"])."]".(($i < $currcount - 1) ? ", " : "];\r\n");
	}

	return $resStr;
}


// Return array of currency information of accounts
function getAccCurrInfo($user_id)
{
	global $db;

	$accCurr = array();

	$resArr = $db->selectQ("c.id AS curr_id, c.sign AS sign, a.id AS id, a.balance AS balance", "accounts AS a, currency AS c", "a.user_id=".$user_id." AND c.id=a.curr_id");
	foreach($resArr as $i => $row)
	{
		$accCurr[$i]["id"] = intval($row["id"]);
		$accCurr[$i]["curr_id"] = intval($row["curr_id"]);
		$accCurr[$i]["sign"] = $row["sign"];
	}

	return $accCurr;
}


// Return currency id of specified account from information array
function getCurrId($accCurr, $account_id)
{
	if (!count($accCurr) || !$account_id)
		return 0;

	foreach($accCurr as $ac)
	{
		if (intval($ac["id"]) == $account_id)
			return $ac["curr_id"];
	}

	return 0;
}


// Return currency sign of specified account from information array
function getCurSign($accCurr, $account_id)
{
	if (!count($accCurr) || !$account_id)
		return NULL;

	foreach($accCurr as $ac)
	{
		if (intval($ac["id"]) == $account_id)
			return $ac["sign"];
	}

	return NULL;
}


// Return currency sign by specified id
function getSign($accCurr, $curr_id)
{
	if (!count($accCurr) || !$curr_id)
		return NULL;

	foreach($accCurr as $ac)
	{
		if (intval($ac["curr_id"]) == $curr_id)
			return $ac["sign"];
	}

	return NULL;
}

?>