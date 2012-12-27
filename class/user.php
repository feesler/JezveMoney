<?php


	// Set password hash for specified user
	function setUserHash($login, $passhash)
	{
		global $db;

		$elogin = $db->escape($login);

		return $db->updateQ("users", array("passhash"), array($passhash), "login=".qnull($elogin));
	}


	// Set password hash for specified user
	function getUserHash($login)
	{
		global $db;

		$elogin = $db->escape($login);

		$resArr = $db->selectQ("passhash", "users", "login=".qnull($elogin));
		if (count($resArr) == 1)
			return $resArr[0]["passhash"];
		else
			return NULL;
	}


	function getSalt($str)
	{
		$bfPrefix = "\$2a\$10\$";

		return substr($bfPrefix.md5($str), 0, 28);
	}


	function getHash($str, $salt)
	{
		return substr(crypt($str, $salt), 28);
	}


	// Check correctness of hash
	function checkHash($str, $salt, $hash)
	{
		$full_hash = $salt.$hash;

		return (crypt($str, $salt) == $full_hash);
	}


	// Create pre hash
	function createPreHash($login, $password)
	{
		$salt = getSalt($login);
		return getHash($password, $salt);
	}


	// Create hash for user
	function createUserHash($login, $password)
	{
		$salt = getSalt($login);
		$hashed = getHash($password, $salt);

		return getHash($hashed, $salt);
	}


	// Check correctness login/password data
	function checkLoginData($login, $password)
	{
		$salt = getSalt($login);
		$hashed = getHash($password, $salt);
		$userHash = getUserHash($login);

		return checkHash($hashed, $salt, $userHash);
	}


	// Check correctness cookies data
	function checkCookie($login, $passhash)
	{
		$salt = getSalt($login);
		$userHash = getUserHash($login);

		return checkHash($passhash, $salt, $userHash);
	}


	// Setup cookies
	function setupCookies($login, $passhash)
	{
		$expTime = time() + 31536000;	// year after now
		$path = "/money/";
		$domain = "jezve.net";

		setcookie("login", $login, $expTime, $path, $domain);
		setcookie("passhash", $passhash, $expTime, $path, $domain);
	}


	// Delete cookies
	function deleteCookies()
	{
		$expTime = time() - 3600;	// hour before now
		$path = "/money/";
		$domain = "jezve.net";

		setcookie("login", "", $expTime, $path, $domain);
		setcookie("passhash", "", $expTime, $path, $domain);
	}


	// Check is user logged in or redirect to specified URL
	function checkUser($url)
	{
		global $db;

		if (isset($_SESSION["userid"]))
		{
			return intval($_SESSION["userid"]);
		}
		else
		{
			if (isset($_COOKIE["login"]) && isset($_COOKIE["passhash"]))
			{
				$loginCook = $_COOKIE["login"];
				$passCook = $_COOKIE["passhash"];

				if (checkCookie($loginCook, $passCook))
				{
					session_start();

					$user_id = getUserId($loginCook);
					$_SESSION["userid"] = $user_id;

					setupCookies($loginCook, $passCook);

					return $user_id;
				}
			}

			setLocation($url);
			exit();
		}
	}


	// Return user name
	function getUserName($id)
	{
		global $db;

		$eid = intval($id);
		if (!$eid)
			return NULL;

		$resArr = $db->selectQ("login", "users", "id=".$eid);

		return ((count($resArr) == 1) ? $resArr[0]["login"] : NULL);
	}


	// Return user name
	function getUserId($login)
	{
		global $db;

		$elogin = $db->escape($login);
		if (!$elogin)
			return 0;

		$resArr = $db->selectQ("id", "users", "login=".qnull($elogin));

		return ((count($resArr) == 1) ? intval($resArr[0]["id"]) : 0);
	}


?>