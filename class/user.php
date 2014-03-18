<?php

class User
{
	// Class constructor
	public function __construct()
	{
	}


	// Return salt for specified string
	private function getSalt($str)
	{
		$bfPrefix = "\$2a\$10\$";

		return substr($bfPrefix.md5($str), 0, 28);
	}


	// Return hash for specified string and salt
	private function getHash($str, $salt)
	{
		return substr(crypt($str, $salt), 28);
	}


	// Check correctness of hash
	private function checkHash($str, $salt, $hash)
	{
		$full_hash = $salt.$hash;

		return (crypt($str, $salt) == $full_hash);
	}


	// Create pre hash
	private function createPreHash($login, $password)
	{
		$salt = $this->getSalt($login);
		return $this->getHash($password, $salt);
	}


	// Create hash for user
	private function createHash($login, $password)
	{
		$salt = $this->getSalt($login);
		$hashed = $this->getHash($password, $salt);

		return $this->getHash($hashed, $salt);
	}


	// Check correctness login/password data
	private function checkLoginData($login, $password)
	{
		$salt = $this->getSalt($login);
		$hashed = $this->getHash($password, $salt);
		$passHash = $this->getPassHash($login);

		return $this->checkHash($hashed, $salt, $passHash);
	}


	// Check correctness cookies data
	private function checkCookie($login, $passhash)
	{
		$salt = $this->getSalt($login);
		$userHash = $this->getPassHash($login);

		return $this->checkHash($passhash, $salt, $userHash);
	}


	// Setup cookies
	private function setupCookies($login, $passhash)
	{
		$expTime = time() + 31536000;	// year after now
		$path = "/money/";
		$domain = "jezve.net";

		setcookie("login", $login, $expTime, $path, $domain);
		setcookie("passhash", $passhash, $expTime, $path, $domain);
	}


	// Delete cookies
	private function deleteCookies()
	{
		$expTime = time() - 3600;	// hour before now
		$path = "/money/";
		$domain = "jezve.net";

		setcookie("login", "", $expTime, $path, $domain);
		setcookie("passhash", "", $expTime, $path, $domain);
	}


	// Check is user logged in and return id
	public function check()
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

		if (!$this->checkCookie($loginCook, $passCook))
		{
			$this->deleteCookies();
			return 0;
		}

		$user_id = $this->getId($loginCook);
		$_SESSION["userid"] = $user_id;

		$this->setupCookies($loginCook, $passCook);

		return $user_id;
	}


	// Check user has admin access
	public function isAdmin($id)
	{
		global $db;

		$eid = intval($id);
		if (!$eid)
			return FALSE;

		$resArr = $db->selectQ("access", "users", "id=".$eid);
		if (count($resArr) != 1)
			return FALSE;

		return (($resArr[0]["access"] & 0x1) == 0x1);
	}


	// Return user name
	public function getName($id)
	{
		global $db;

		$eid = intval($id);
		if (!$eid)
			return NULL;

		$resArr = $db->selectQ("login", "users", "id=".$eid);

		return ((count($resArr) == 1) ? $resArr[0]["login"] : NULL);
	}


	// Return user id by specified login
	public function getId($login)
	{
		global $db;

		$elogin = $db->escape($login);
		if (!$elogin)
			return 0;

		$resArr = $db->selectQ("id", "users", "login=".qnull($elogin));

		return ((count($resArr) == 1) ? intval($resArr[0]["id"]) : 0);
	}


	// Set owner person for specified user
	public function setOwner($user_id, $owner_id)
	{
		global $db;

		$u_id = intval($user_id);
		$o_id = intval($owner_id);
		if (!$u_id || !$o_id)
			return FALSE;

		return $db->updateQ("users", array("owner_id"), array($owner_id), "id=".qnull($u_id));
	}


	// Return owner person of specified user
	public function getOwner($user_id)
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
	public function setPassHash($login, $passhash)
	{
		global $db;

		$elogin = $db->escape($login);

		return $db->updateQ("users", array("passhash"), array($passhash), "login=".qnull($elogin));
	}


	// Return password hash for specified user
	public function getPassHash($login)
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
	public function register($login, $password, $p_name)
	{
		global $db;

		if (!$login || $login == "" || !$password || $password == "" || !$p_name || $p_name == "")
			return FALSE;

		// check user exist
		if ($this->getId($login) != 0)
			return FALSE;

		$passhash = $this->createHash($login, $password);
		$elogin = $db->escape($login);

		if (!$db->insertQ("users", array("id", "login", "passhash"), array(NULL, $elogin, $passhash)))
			return FALSE;

		$user_id = $db->insertId();

		$p = new Person($user_id);
		$p_id = $p->create($p_name);

		$this->setOwner($user_id, $p_id);

		return TRUE;
	}


	// Loggin in user
	public function login($login, $password)
	{
		global $db;

		if (!$login || $login == "" || !$password || $password == "")
			return FALSE;

		$elogin = $db->escape($login);
		if (!$this->checkLoginData($elogin, $password))
			return FALSE;

		session_start();
		$_SESSION["userid"] = $this->getId($login);

		$preHash = $this->createPreHash($login, $password);

		$this->setupCookies($login, $preHash);

		return TRUE;
	}


	// Loggin out user
	public function logout()
	{
		session_start();
		session_unset();
		session_destroy();

		$this->deleteCookies();
	}


	// Change user password
	public function changePassword($login, $oldpass, $newpass)
	{
		if (!$login || !$oldpass || !$newpass)
			return FALSE;

		if (!$this->checkLoginData($login, $oldpass))
			return FALSE;

		return $this->setPassword($login, $newpass);
	}


	// Set up new password for user
	public function setPassword($login, $newpass)
	{
		if (!$login || !$newpass)
			return FALSE;

		$user_id = $this->getId($login);

		$passhash = $this->createHash($login, $newpass);
		if (!$this->setPassHash($login, $passhash))
			return FALSE;

		$preHash = $this->createPreHash($login, $newpass);
		$this->setupCookies($login, $preHash);

		return TRUE;
	}
}

?>