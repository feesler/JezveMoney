<?php

	define("EXPENSE", 1);
	define("INCOME", 2);
	define("TRANSFER", 3);
	define("DEBT", 4);


	// Set location header to redirect page and exit from script
	function setLocation($loc)
	{
		header("Location: ".$loc);
		exit();
	}


	// Check class name and try to load file
	function autoLoadClass($className)
	{
		$classes = [
			"CachedTable" => "system/cachedTable.php",
			"Controller" => "system/controller.php",
			"Model" => "system/model.php",
			"Singleton" => "system/singleton.php",
			"TemplateController" => "system/templatecontroller.php",
			"ApiController" => "system/apicontroller.php",
			"AdminController" => "system/admincontroller.php",
		// Controllers
			"MainController" => "Controller/main.php",
			"AccountsController" => "Controller/accounts.php",
			"PersonsController" => "Controller/persons.php",
			"TransactionsController" => "Controller/transactions.php",
			"UserController" => "Controller/user.php",
			"ProfileController" => "Controller/profile.php",
			"StatisticsController" => "Controller/statistics.php",
			"FastCommitController" => "Controller/fastcommit.php",
			"CheckBalanceController" => "Controller/checkbalance.php",
		// API controllers
			"CurrencyApiController" => "api/Controller/currency.php",
			"AccountApiController" => "api/Controller/account.php",
			"PersonApiController" => "api/Controller/person.php",
			"TransactionApiController" => "api/Controller/transaction.php",
			"UserApiController" => "api/Controller/user.php",
			"ProfileApiController" => "api/Controller/profile.php",
			"StateApiController" => "api/Controller/state.php",
		// Admin controllers
			"CurrencyAdminController" => "admin/Controller/currency.php",
			"BalanceAdminController" => "admin/Controller/balance.php",
			"UserAdminController" => "admin/Controller/user.php",
			"MainAdminController" => "admin/Controller/main.php",
			"QueryAdminController" => "admin/Controller/query.php",
			"LogsAdminController" => "admin/Controller/log.php",
			"TestsAdminController" => "admin/Controller/tests.php",
			"ApiConsoleAdminController" => "admin/Controller/apiconsole.php",
		// Items
			"Account" => "api/item/account.php",
			"Person" => "api/item/person.php",
			"Transaction" => "api/item/transaction.php",
			"Currency" => "api/item/currency.php",
		// Models
			"AccountModel" => "Model/account.php",
			"CurrencyModel" => "Model/currency.php",
			"DebtModel" => "Model/debt.php",
			"MySqlDB" => "system/mysql.php",
			"PersonModel" => "Model/person.php",
			"TransactionModel" => "Model/transaction.php",
			"UserModel" => "Model/user.php",
			"apiResponse" => "system/apiResponse.php"
		];

		if (isset($classes[$className]))
		{
			require(APP_ROOT.$classes[$className]);
		}
	}


	// Check string is null or empty
	function is_empty($str)
	{
		return is_null($str) || $str == "";
	}


	// Convert string to be compatible with HTML
	function e($str, $lineEnd = FALSE)
	{
		$str = htmlentities($str, ENT_QUOTES, "UTF-8");
		if ($lineEnd)
			$str = str_replace(["\r\n", "\r", "\n"], "<br>", $str);

		return $str;
	}


	// Format value
	function valFormat($format, $val)
	{
		if (!is_numeric($val))
			return "";

		$val = floatval($val);

		if (strval(round($val)) == strval($val))
			$nf = number_format($val, 0, "", " ");
		else
			$nf = number_format($val, 2, ".", " ");

		if ($format && $format != "")
			return sprintf($format, $nf);
		else
			return $nf;
	}


	// Check session and start if it is not started yet
	function sessionStart()
	{
		if (session_id())
			return;

		session_start();
	}


	// Build URL from base and array of parameters
	function urlJoin($base, $params = NULL, $raw = FALSE)
	{
		if (is_empty($base))
			return "";

		if (!is_array($params))
			return $base;

		$pairs = [];
		$encode = ($raw) ? "rawurlencode" : "urlencode";
		foreach($params as $pkey => $pval)
		{
			if (is_array($pval))
			{
				foreach($pval as $akey => $avalue)
				{
					if (is_string($akey))
						$pairs[] = $encode($pkey)."[".$encode($akey)."]=".$encode($avalue);
					else if (is_numeric($akey))
						$pairs[] = $encode($pkey)."[]=".$encode($avalue);
				}
			}
			else if (!is_null($pval) && !is_object($pval))
			{
				$pairs[] = $encode($pkey)."=".$encode($pval);
			}
		}

		$resStr = $base;
		if (count($pairs))
			$resStr .= "?";
		$resStr .= implode("&", $pairs);

		return $resStr;
	}


	function pathJoin(...$segments)
	{
		if (!is_array($segments) || !count($segments))
			return "";

		$trimmed = [];
		$res = (strpos($segments[0], DIRECTORY_SEPARATOR) === 0) ? DIRECTORY_SEPARATOR : "";
		foreach($segments as $segment)
		{
			$trimmed[] = trim($segment, DIRECTORY_SEPARATOR);
		}

		$res .= implode(DIRECTORY_SEPARATOR, $trimmed).DIRECTORY_SEPARATOR;

		return $res;
	}


	// Append to file name unique string to fix cache issues
	function auto_version($file)
	{
		if (!file_exists(APP_ROOT.$file))
			return $file;

		$mtime = filemtime(APP_ROOT.$file);
		return $file."?".$mtime;
	}


	function skipZeros($arr)
	{
		$res = [];
		if (!is_array($arr))
			$arr = [ $arr ];

		foreach($arr as $val)
		{
			$val = intval($val);
			if ($val)
				$res[] = $val;
		}

		return $res;
	}


	// Check is all of expected fields present in the array or object
	// Return array with only expected fields or FALSE if something goes wrong
	function checkFields($obj, $expectedFields, $throw = FALSE)
	{
		if (is_null($obj) || !is_array($expectedFields))
		{
			if ($throw)
				throw new Error("Invalid input");
			else
				return FALSE;
		}

		if (!is_array($obj))
			$obj = (array)$obj;

		$res = [];
		foreach($expectedFields as $field)
		{
			if (!array_key_exists($field, $obj))
			{
				if ($throw)
					throw new Error("Field $field not found");
				else
					return FALSE;
			}

			$res[$field] = $obj[$field];
		}

		return $res;
	}


	// Return content of specified SVG icon
	function svgIcon($name)
	{
		$fileName = APP_ROOT."view/img/svg/$name.svg";
		if (!file_exists($fileName))
			return "";

		$content = file_get_contents($fileName);
		return $content;
	}


	// Return SVG use content for specified icon
	// Related SVG symbols should be available on target page
	function useIcon($name, $width = NULL, $height = NULL)
	{
		if (is_empty($name))
			return "";

		$width = $width ?? 32;
		if (is_int($width))
			$width = $width."px";

		$height = $height ?? $width;

		return "<svg class=\"icon-$name\" width=\"$width\" height=\"$height\">".
				"<use xlink:href=\"#$name\"></use>".
				"</svg>";
	}