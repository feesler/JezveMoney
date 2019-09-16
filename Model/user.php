<?php

class UserModel extends CachedTable
{
	static private $dcache = NULL;


	// Class constructor
	public function __construct()
	{
		$this->tbl_name = "users";
		$this->dbObj = mysqlDB::getInstance();
		if (!$this->dbObj->isTableExist($this->tbl_name))
			$this->createTable();
	}


	// Create DB table if not exist
	private function createTable()
	{
		wlog("UserModel::createTable()");

		$res = $this->dbObj->createTableQ($this->tbl_name,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`login` VARCHAR(255) NOT NULL, ".
						"`passhash` VARCHAR(64) NOT NULL, ".
						"`owner_id` INT(11) NOT NULL, ".
						"`access` INT(11) NOT NULL DEFAULT '0', ".
						"`createdate` DATETIME NOT NULL, ".
						"`updatedate` DATETIME NOT NULL, ".
						"PRIMARY KEY (`id`)",
						"DEFAULT CHARACTER SET = utf8 COLLATE utf8_general_ci");

		return $res;
	}


	// Return link to cache of derived class
	protected function &getDerivedCache()
	{
		return self::$dcache;
	}


	// Update cache
	protected function updateCache()
	{
		self::$dcache = [];

		$resArr = $this->dbObj->selectQ("*", $this->tbl_name);
		foreach($resArr as $row)
		{
			$user_id = $row["id"];

			self::$dcache[$user_id]["login"] = $row["login"];
			self::$dcache[$user_id]["passhash"] = $row["passhash"];
			self::$dcache[$user_id]["owner_id"] = intval($row["owner_id"]);
			self::$dcache[$user_id]["access"] = intval($row["access"]);
			self::$dcache[$user_id]["createdate"] = strtotime($row["createdate"]);
			self::$dcache[$user_id]["updatedate"] = strtotime($row["updatedate"]);
		}
	}


	// Return salt for specified string
	private function getSalt($str)
	{
		$bfPrefix = "\$2y\$10\$";

		return $bfPrefix.substr(md5($str), 0, 21)."\$";
	}


	// Return hash for specified string and salt
	private function getHash($str, $salt)
	{
		return substr(crypt($str, $salt), 28);
	}


	// Check correctness of hash
	private function checkHash($str, $salt, $hash)
	{
		$full_hash = substr($salt, 0, 28).$hash;

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

		setcookie("login", $login, $expTime, APPPATH, APPHOST, isSecure() ? 1 : 0);
		setcookie("passhash", $passhash, $expTime, APPPATH, APPHOST, isSecure() ? 1 : 0);
	}


	// Delete cookies
	private function deleteCookies()
	{
		$expTime = time() - 3600;	// hour before now

		setcookie("login", "", $expTime, APPPATH, APPHOST, isSecure() ? 1 : 0);
		setcookie("passhash", "", $expTime, APPPATH, APPHOST, isSecure() ? 1 : 0);
	}


	// Check is user logged in and return id
	public function check()
	{
		sessionStart();

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
		$u_id = intval($user_id);
		$o_id = intval($owner_id);
		if (!$u_id || !$o_id)
			return FALSE;

		// check owner is already the same
		$cur_owner = $this->getOwner($u_id);
		if ($cur_owner == $o_id)
			return TRUE;

		// check specified person not own another user
		$resArr = $this->dbObj->selectQ("id", $this->tbl_name, "owner_id=".$o_id);
		if (count($resArr) > 0)
			return FALSE;

		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->updateQ($this->tbl_name,
									[ "owner_id" => $o_id, "updatedate" => $curDate ],
									"id=".qnull($u_id)))
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
		$elogin = $this->dbObj->escape($login);
		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->updateQ($this->tbl_name,
									[ "passhash" => $passhash, "updatedate" => $curDate],
									"login=".qnull($elogin)))
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
		if (!$login || $login == "" || !$password || $password == "" || !$p_name || $p_name == "")
			return FALSE;

		// check user exist
		if ($this->getId($login) != 0)
			return FALSE;

		$passhash = $this->createHash($login, $password);
		$elogin = $this->dbObj->escape($login);
		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->insertQ($this->tbl_name, ["id", "login", "passhash", "createdate", "updatedate"], [NULL, $elogin, $passhash, $curDate, $curDate]))
			return FALSE;

		$user_id = $this->dbObj->insertId();

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

		sessionStart();
		$_SESSION["userid"] = $this->getId($login);

		$preHash = $this->createPreHash($login, $password);

		$this->setupCookies($login, $preHash);

		return TRUE;
	}


	// Loggin out user
	public function logout()
	{
		sessionStart();
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


	// Set up new login for user
	public function setLogin($user_id, $login)
	{
		$user_id = intval($user_id);
		if (!$user_id || is_empty($login))
			return FALSE;

		// check user is exist
		$curLogin = $this->getLogin($user_id);
		if (is_null($curLogin))
			return FALSE;

		// check current login is not the same
		if ($curLogin == $login)
			return TRUE;

		// check no user exist with the same login
		$luser_id = $this->getId($login);
		if ($luser_id != 0 && $luser_id != $user_id)
			return FALSE;

		$passhash = $this->createHash($login, $newpass);
		$elogin = $this->dbObj->escape($login);
		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->updateQ($this->tbl_name,
									[ "login" => $elogin, "passhash" => $passhash, "updatedate" => $curDate],
									"id=".$user_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Set up new login for user
	public function setAccess($user_id, $access)
	{
		$user_id = intval($user_id);
		$access = intval($access);
		if (!$user_id)
			return FALSE;

		// check user is exist
		$curAccess = $this->getAccess($user_id);
		if (is_null($curAccess))
			return FALSE;

		// check current access level is not the same
		if ($curAccess == $access)
			return TRUE;

		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->updateQ($this->tbl_name,
									[ "access" => $access, "updatedate" => $curDate ],
									"id=".$user_id))
			return FALSE;

		$this->cleanCache();

		return TRUE;
	}


	// Return array of users
	public function getArray()
	{
		$res = [];

		if (!$this->checkCache())
			return $res;

		$trCountArr = [];
		$resArr = $this->dbObj->selectQ("user_id, COUNT(*)", "transactions", NULL, "user_id");
		foreach ($resArr as $row)
		{
			$u_id = intval($row["user_id"]);
			$tr_cnt = intval($row["COUNT(*)"]);

			$trCountArr[$u_id] = $tr_cnt;
		}

		$accCountArr = [];
		$resArr = $this->dbObj->selectQ("user_id, owner_id, COUNT(*)", "accounts", NULL, "owner_id");
		foreach ($resArr as $row)
		{
			$u_id = intval($row["user_id"]);
			$o_id = intval($row["owner_id"]);
			$acc_cnt = intval($row["COUNT(*)"]);

			$accCountArr[$o_id] = $acc_cnt;
		}

		foreach($this->cache as $u_id => $row)
		{
			$userObj = new stdClass;

			$userObj->id = $u_id;
			$userObj->login = $row["login"];
			$userObj->access = $row["access"];

			$pMod = new PersonModel($u_id);
			$userObj->owner = $pMod->getName($row["owner_id"]);
			$userObj->accCount = isset($accCountArr[$row["owner_id"]]) ? $accCountArr[$row["owner_id"]] : 0;
			$userObj->trCount = isset($trCountArr[$u_id]) ? $trCountArr[$u_id] : 0;
			$userObj->pCount = $pMod->getCount();

			$res[] = $userObj;
		}

		return $res;
	}


	// Delete user and all related data
	public function del($user_id)
	{
		$u_id = intval($user_id);
		if (!$u_id)
			return FALSE;

		$accMod = new AccountModel($u_id);
		if (!$accMod->reset())
			return FALSE;

		if (!$this->dbObj->deleteQ("persons", "user_id=".$u_id))
			return FALSE;

		if (!$this->dbObj->deleteQ($this->tbl_name, "id=".$u_id))
			return FALSE;

		return TRUE;
	}
}
