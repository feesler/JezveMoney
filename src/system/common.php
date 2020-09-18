<?php

	define("EXPENSE", 1);
	define("INCOME", 2);
	define("TRANSFER", 3);
	define("DEBT", 4);

	define("ACCOUNT_HIDDEN", 1);

	define("PERSON_HIDDEN", 1);

	define("WHITE_THEME", 0);
	define("DARK_THEME", 1);

	// Icon types
	define("ICON_TILE", 1);


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
			"JezveMoney\\Core\\MySqlDB" => "system/mysql.php",
			"JezveMoney\\Core\\apiResponse" => "system/apiResponse.php",
			"JezveMoney\\Core\\Logger" => "system/log.php",
			"JezveMoney\\Core\\CachedTable" => "system/cachedTable.php",
			"JezveMoney\\Core\\Controller" => "system/controller.php",
			"JezveMoney\\Core\\Model" => "system/model.php",
			"JezveMoney\\Core\\Singleton" => "system/singleton.php",
			"JezveMoney\\Core\\DBVersion" => "system/dbver.php",
			"JezveMoney\\Core\\TemplateController" => "system/templatecontroller.php",
			"JezveMoney\\Core\\ApiController" => "system/apicontroller.php",
			"JezveMoney\\Core\\AdminController" => "system/admincontroller.php",
		// Controllers
			"JezveMoney\\App\\Controller\\MainController" => "Controller/main.php",
			"JezveMoney\\App\\Controller\\AccountsController" => "Controller/accounts.php",
			"JezveMoney\\App\\Controller\\PersonsController" => "Controller/persons.php",
			"JezveMoney\\App\\Controller\\TransactionsController" => "Controller/transactions.php",
			"JezveMoney\\App\\Controller\\UserController" => "Controller/user.php",
			"JezveMoney\\App\\Controller\\ProfileController" => "Controller/profile.php",
			"JezveMoney\\App\\Controller\\StatisticsController" => "Controller/statistics.php",
			"JezveMoney\\App\\Controller\\FastCommitController" => "Controller/fastcommit.php",
			"JezveMoney\\App\\Controller\\CheckBalanceController" => "Controller/checkbalance.php",
		// API controllers
			"JezveMoney\\App\\API\\Controller\\CurrencyApiController" => "api/Controller/currency.php",
			"JezveMoney\\App\\API\\Controller\\IconApiController" => "api/Controller/icon.php",
			"JezveMoney\\App\\API\\Controller\\AccountApiController" => "api/Controller/account.php",
			"JezveMoney\\App\\API\\Controller\\PersonApiController" => "api/Controller/person.php",
			"JezveMoney\\App\\API\\Controller\\TransactionApiController" => "api/Controller/transaction.php",
			"JezveMoney\\App\\API\\Controller\\UserApiController" => "api/Controller/user.php",
			"JezveMoney\\App\\API\\Controller\\ProfileApiController" => "api/Controller/profile.php",
			"JezveMoney\\App\\API\\Controller\\StateApiController" => "api/Controller/state.php",
		// Admin controllers
			"JezveMoney\\App\\Admin\\Controller\\DBInstallAdminController" => "admin/Controller/dbinstall.php",
			"JezveMoney\\App\\Admin\\Controller\\CurrencyAdminController" => "admin/Controller/currency.php",
			"JezveMoney\\App\\Admin\\Controller\\IconAdminController" => "admin/Controller/icon.php",
			"JezveMoney\\App\\Admin\\Controller\\BalanceAdminController" => "admin/Controller/balance.php",
			"JezveMoney\\App\\Admin\\Controller\\UserAdminController" => "admin/Controller/user.php",
			"JezveMoney\\App\\Admin\\Controller\\MainAdminController" => "admin/Controller/main.php",
			"JezveMoney\\App\\Admin\\Controller\\QueryAdminController" => "admin/Controller/query.php",
			"JezveMoney\\App\\Admin\\Controller\\LogsAdminController" => "admin/Controller/log.php",
			"JezveMoney\\App\\Admin\\Controller\\TestsAdminController" => "admin/Controller/tests.php",
			"JezveMoney\\App\\Admin\\Controller\\ApiConsoleAdminController" => "admin/Controller/apiconsole.php",
		// Items
			"JezveMoney\\App\\Item\\Account" => "api/item/account.php",
			"JezveMoney\\App\\Item\\Person" => "api/item/person.php",
			"JezveMoney\\App\\Item\\Transaction" => "api/item/transaction.php",
			"JezveMoney\\App\\Item\\Currency" => "api/item/currency.php",
			"JezveMoney\\App\\Item\\Icon" => "api/item/icon.php",
		// Models
			"JezveMoney\\App\\Model\\AccountModel" => "Model/account.php",
			"JezveMoney\\App\\Model\\CurrencyModel" => "Model/currency.php",
			"JezveMoney\\App\\Model\\IconModel" => "Model/icon.php",
			"JezveMoney\\App\\Model\\DebtModel" => "Model/debt.php",
			"JezveMoney\\App\\Model\\PersonModel" => "Model/person.php",
			"JezveMoney\\App\\Model\\TransactionModel" => "Model/transaction.php",
			"JezveMoney\\App\\Model\\UserModel" => "Model/user.php"
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


	// Return file modification timestamp
	function getModifiedTime($file)
	{
		if (!is_string($file) || !file_exists(APP_ROOT.$file))
			return FALSE;

		return filemtime(APP_ROOT.$file);
	}


	// Append to file name unique string to fix cache issues
	function auto_version($file)
	{
		$mtime = getModifiedTime($file);
		if ($mtime === FALSE)
			return $file;

		return $file."?".$mtime;
	}


	function getThemes($base)
	{
		$themeFiles = [
			WHITE_THEME => "white-theme.css",
			DARK_THEME => "dark-theme.css"
		];

		$res = [];
		foreach($themeFiles as $theme_id => $themeName)
		{
			$mtime = getModifiedTime($base.$themeName);
			if ($mtime === FALSE)
				continue;

			$res[$theme_id] = $themeName."?".$mtime;
		}

		return $res;
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
		if (is_null($obj) || !isset($expectedFields) || !is_array($expectedFields))
		{
			if ($throw)
				throw new \Error("Invalid input");
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
					throw new \Error("Field $field not found");
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