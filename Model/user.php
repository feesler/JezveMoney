<?php

class UserModel extends CachedTable
{
	static private $dcache = NULL;


	// Class constructor
	public function __construct()
	{
	}


	// Return link to cache of derived class
	protected function &getDerivedCache()
	{
		return self::$dcache;
	}


	// Update cache
	protected function updateCache()
	{
		global $db;

		self::$dcache = array();

		$resArr = $db->selectQ("*", "users");
		foreach($resArr as $row)
		{
			$user_id = $row["id"];

			self::$dcache[$user_id]["login"] = $row["login"];
			self::$dcache[$user_id]["passhash"] = $row["passhash"];
			self::$dcache[$user_id]["owner_id"] = intval($row["owner_id"]);
			self::$dcache[$user_id]["access"] = intval($row["access"]);
		}
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


	// Check correctness of cookies data
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

		setcookie("login", $login, $expTime, APPPATH, APPHOST);
		setcookie("passhash", $passhash, $expTime, APPPATH, APPHOST);
	}


	// Delete cookies
	private function deleteCookies()
	{
		$expTime = time() - 3600;	// hour before now

		setcookie("login", "", $expTime, APPPATH, APPHOST);
		setcookie("passhash", "", $expTime, APPPATH, APPHOST);
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


	// Return access type of specified user
	public function getAccess($id)
	{
		return $this->getCache($id, "access");
	}


	// Check user has admin access
	public function isAdmin($id)
	{
		return (($this->getAccess($id) & 0x1) == 0x1);
	}


	// Return login of user
	public function getLogin($id)
	{
		return $this->getCache($id, "login");
	}


	// Return user id by specified login
	public function getId($login)
	{
		if (!$this->checkCache())
			return 0;

		foreach(self::$dcache as $u_id => $row)
		{
			if ($row["login"] == $login)
				return $u_id;
		}

		return 0;
	}


	// Set owner person for specified user
	public function setOwner($user_id, $owner_id)
	{
		global $db;

		$u_id = intval($user_id);
		$o_id = intval($owner_id);
		if (!$u_id || !$o_id)
			return FALSE;

		// check owner is already the same
		$cur_owner = $this->getOwner($u_id);
		if ($cur_owner == $o_id)
			return TRUE;

		// check specified person not own another user
		$resArr = $db->selectQ("id", "users", "owner_id=".$o_id);
		if (count($resArr) > 0)
			return FALSE;

		if (!$db->updateQ("users", array("owner_id"), array($o_id), "id=".qnull($u_id)))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Return owner person of specified user
	public function getOwner($user_id)
	{
		return $this->getCache($user_id, "owner_id");
	}


	// Set password hash for specified user
	public function setPassHash($login, $passhash)
	{
		global $db;

		$elogin = $db->escape($login);

		if (!$db->updateQ("users", array("passhash"), array($passhash), "login=".qnull($elogin)))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Return password hash for specified user
	public function getPassHash($login)
	{
		$u_id = $this->getId($login);

		return $this->getCache($u_id, "passhash");
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

		$pMod = new PersonModel($user_id);
		$p_id = $pMod->create($p_name);

		$this->setOwner($user_id, $p_id);

		$this->cleanCache();

		return TRUE;
	}


	// Loggin in user
	public function login($login, $password)
	{
		if (!$login || $login == "" || !$password || $password == "")
			return FALSE;

		if (!$this->checkLoginData($login, $password))
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
