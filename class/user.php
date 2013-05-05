<?php

class User
{
	// Return salt for specified string
	private static function getSalt($str)
	{
		$bfPrefix = "\$2a\$10\$";

		return substr($bfPrefix.md5($str), 0, 28);
	}


	// Return hash for specified string and salt
	private static function getHash($str, $salt)
	{
		return substr(crypt($str, $salt), 28);
	}


	// Check correctness of hash
	private static function checkHash($str, $salt, $hash)
	{
		$full_hash = $salt.$hash;

		return (crypt($str, $salt) == $full_hash);
	}


	// Create pre hash
	private static function createPreHash($login, $password)
	{
		$salt = self::getSalt($login);
		return self::getHash($password, $salt);
	}


	// Create hash for user
	private static function createHash($login, $password)
	{
		$salt = self::getSalt($login);
		$hashed = self::getHash($password, $salt);

		return self::getHash($hashed, $salt);
	}


	// Check correctness login/password data
	private static function checkLoginData($login, $password)
	{
		$salt = self::getSalt($login);
		$hashed = self::getHash($password, $salt);
		$passHash = self::getPassHash($login);

		return self::checkHash($hashed, $salt, $passHash);
	}


	// Check correctness cookies data
	private static function checkCookie($login, $passhash)
	{
		$salt = self::getSalt($login);
		$userHash = self::getPassHash($login);

		return self::checkHash($passhash, $salt, $userHash);
	}


	// Setup cookies
	private static function setupCookies($login, $passhash)
	{
		$expTime = time() + 31536000;	// year after now
		$path = "/money/";
		$domain = "jezve.net";

		setcookie("login", $login, $expTime, $path, $domain);
		setcookie("passhash", $passhash, $expTime, $path, $domain);
	}


	// Delete cookies
	private static function deleteCookies()
	{
		$expTime = time() - 3600;	// hour before now
		$path = "/money/";
		$domain = "jezve.net";

		setcookie("login", "", $expTime, $path, $domain);
		setcookie("passhash", "", $expTime, $path, $domain);
	}


	// Check is user logged in and return id
	public static function check()
	{
		session_start();

		$user_id = 0;

		// check session variable
		if (isset($_SESSION["userid"]))
			return intval($_SESSION["userid"]);

		// check cookies
		if (!isset($_COOKIE["login"]) || !isset($_COOKIE["passhash"]))
			return 0;

		$loginCook = $_COOKIE["login"];
		$passCook = $_COOKIE["passhash"];

		if (!self::checkCookie($loginCook, $passCook))
		{
			self::deleteCookies();
			return 0;
		}

		$user_id = self::getId($loginCook);
		$_SESSION["userid"] = $user_id;

		self::setupCookies($loginCook, $passCook);

		return $user_id;
	}


	// Return user name
	public static function getName($id)
	{
		global $db;

		$eid = intval($id);
		if (!$eid)
			return NULL;

		$resArr = $db->selectQ("login", "users", "id=".$eid);

		return ((count($resArr) == 1) ? $resArr[0]["login"] : NULL);
	}


	// Return user id by specified login
	public static function getId($login)
	{
		global $db;

		$elogin = $db->escape($login);
		if (!$elogin)
			return 0;

		$resArr = $db->selectQ("id", "users", "login=".qnull($elogin));

		return ((count($resArr) == 1) ? intval($resArr[0]["id"]) : 0);
	}


	// Set password hash for specified user
	public static function setOwner($user_id, $owner_id)
	{
		global $db;

		$u_id = intval($user_id);
		$o_id = intval($owner_id);
		if (!$u_id || !$o_id)
			return FALSE;

		return $db->updateQ("users", array("owner_id"), array($owner_id), "id=".qnull($u_id));
	}


	// Return password hash for specified user
	public static function getOwner($user_id)
	{
		global $db;

		if (!is_numeric($user_id))
			return 0;

		$u_id = intval($user_id);
		if (!$u_id)
			return 0;

		$resArr = $db->selectQ("owner_id", "users", "id=".qnull($u_id));
		if (count($resArr) == 1)
			return intval($resArr[0]["owner_id"]);
		else
			return 0;
	}


	// Set password hash for specified user
	public static function setPassHash($login, $passhash)
	{
		global $db;

		$elogin = $db->escape($login);

		return $db->updateQ("users", array("passhash"), array($passhash), "login=".qnull($elogin));
	}


	// Return password hash for specified user
	public static function getPassHash($login)
	{
		global $db;

		$elogin = $db->escape($login);

		$resArr = $db->selectQ("passhash", "users", "login=".qnull($elogin));
		if (count($resArr) == 1)
			return $resArr[0]["passhash"];
		else
			return NULL;
	}


	// Register new user
	public static function register($login, $password, $p_name)
	{
		global $db;

		if (!$login || $login == "" || !$password || $password == "" || !$p_name || $p_name == "")
			return FALSE;

		// check user exist
		if (self::getId($login) != 0)
			return FALSE;

		$passhash = self::createHash($login, $password);
		$elogin = $db->escape($login);

		if (!$db->insertQ("users", array("id", "login", "passhash"), array(NULL, $elogin, $passhash)))
			return FALSE;

		$user_id = $db->insertId();

		$p = new Person($user_id);
		$p_id = $p->create($p_name);

		self::setOwner($user_id, $p_id);

		return TRUE;
	}


	// Loggin in user
	public static function login($login, $password)
	{
		global $db;

		if (!$login || $login == "" || !$password || $password == "")
			return FALSE;

		$elogin = $db->escape($login);
		if (!self::checkLoginData($elogin, $password))
			return FALSE;

		session_start();
		$_SESSION["userid"] = self::getId($login);

		$preHash = self::createPreHash($login, $password);

		self::setupCookies($login, $preHash);

		return TRUE;
	}


	// Loggin out user
	public static function logout()
	{
		session_start();
		session_unset();
		session_destroy();

		self::deleteCookies();
	}


	// Change user password
	public static function changePassword($login, $oldpass, $newpass)
	{
		if (!$login || !$oldpass || !$newpass)
			return FALSE;

		if (!self::checkLoginData($login, $oldpass))
			return FALSE;

		return self::setPassword($login, $newpass);
	}


	// Set up new password for user
	public static function setPassword($login, $newpass)
	{
		if (!$login || !$newpass)
			return FALSE;

		$user_id = self::getId($login);

		$passhash = self::createHash($login, $newpass);
		if (!self::setPassHash($login, $passhash))
			return FALSE;

		$preHash = self::createPreHash($login, $newpass);
		self::setupCookies($login, $preHash);

		return TRUE;
	}
}

?>