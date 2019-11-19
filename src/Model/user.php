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
						"DEFAULT CHARACTER SET = utf8 COLLATE utf8mb4_general_ci");

		return $res;
	}


	// Return link to cache of derived class
	protected function &getDerivedCache()
	{
		return self::$dcache;
	}


	// Convert DB row to item object
	protected function rowToObj($row)
	{
		if (is_null($row))
			return NULL;

		$res = new stdClass;
		$res->id = intval($row["id"]);
		$res->login = $row["login"];
		$res->passhash = $row["passhash"];
		$res->owner_id = intval($row["owner_id"]);
		$res->access = intval($row["access"]);
		$res->createdate = strtotime($row["createdate"]);
		$res->updatedate = strtotime($row["updatedate"]);

		return $res;
	}


	// Called from CachedTable::updateCache() and return data query object
	protected function dataQuery()
	{
		return $this->dbObj->selectQ("*", $this->tbl_name);
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

		$user_id = $this->getIdByLogin($loginCook);
		$_SESSION["userid"] = $user_id;

		$this->setupCookies($loginCook, $passCook);

		return $user_id;
	}


	// Return access type of specified user
	public function getAccess($id)
	{
		$uObj = $this->getItem($id);
		if (!$uObj)
			return NULL;

		return $uObj->access;
	}


	// Check user has admin access
	public function isAdmin($id)
	{
		return (($this->getAccess($id) & 0x1) == 0x1);
	}


	// Return login of user
	public function getLogin($id)
	{
		$uObj = $this->getItem($id);
		if (!$uObj)
			return NULL;

		return $uObj->login;
	}


	// Return user id by specified login
	public function getIdByLogin($login)
	{
		if (!$this->checkCache())
			return 0;

		foreach($this->cache as $u_id => $item)
		{
			if ($item->login == $login)
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
		$uObj = $this->getItem($u_id);
		if (!$uObj)
			return FALSE;
		$cur_owner = $uObj->owner_id;
		if ($cur_owner == $o_id)
			return TRUE;

		// check specified person not own another user
		$qResult = $this->dbObj->selectQ("id", $this->tbl_name, "owner_id=".$o_id);
		if ($this->dbObj->rowsCount($qResult) > 0)
			return FALSE;

		$curDate = date("Y-m-d H:i:s");

		if (!$this->dbObj->updateQ($this->tbl_name,
									[ "owner_id" => $o_id, "updatedate" => $curDate ],
									"id=".qnull($u_id)))
			return FALSE;

		$this->cleanCache();

		return TRUE;
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
		$u_id = $this->getIdByLogin($login);

		$uObj = $this->getItem($u_id);
		if (!$uObj)
			return NULL;

		return $uObj->passhash;
	}


	protected function checkParams($params, $isUpdate = FALSE)
	{
		$avFields = ["login", "password", "name"];
		$res = [];

		if (!$isUpdate)
		{
			foreach($avFields as $field)
			{
				if (!isset($params[$field]))
				{
					wlog($field." parameter not found");
					return NULL;
				}
			}
		}

		if (isset($params["login"]))
		{
			$res["login"] = $this->dbObj->escape($params["login"]);
			if (is_empty($res["login"]))
			{
				wlog("Invalid login specified");
				return NULL;
			}
		}

		if (isset($params["password"]) && isset($res["login"]))
		{
			$res["passhash"] = $this->createHash($res["login"], $params["password"]);
			if (is_empty($res["passhash"]))
			{
				wlog("Invalid password specified");
				return NULL;
			}
		}

		if (isset($params["name"]))
		{
			$res["name"] = $this->dbObj->escape($params["name"]);
			if (is_empty($res["name"]))
			{
				wlog("Invalid name specified");
				return NULL;
			}
		}

		return $res;
	}


	protected function preCreate($params)
	{
		$res = $this->checkParams($params);
		if (is_null($res))
			return NULL;

		// check user exist
		if ($this->getIdByLogin($res["login"]) != 0)
			return FALSE;

		$res["owner_id"] = 0;
		$res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
		$this->personName = $res["name"];
		unset($res["name"]);

		return $res;
	}


	protected function postCreate($item_id)
	{
		$this->cleanCache();

		$pMod = new PersonModel($item_id);
		$p_id = $pMod->create($this->personName);
		unset($this->personName);

		$this->setOwner($item_id, $p_id);
	}


	// Loggin in user
	public function login($login, $password)
	{
		if (!$login || $login == "" || !$password || $password == "")
			return FALSE;

		if (!$this->checkLoginData($login, $password))
			return FALSE;

		sessionStart();
		$_SESSION["userid"] = $this->getIdByLogin($login);

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

		$user_id = $this->getIdByLogin($login);

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
		$luser_id = $this->getIdByLogin($login);
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
		$qResult = $this->dbObj->selectQ("user_id, COUNT(*)", "transactions", NULL, "user_id");
		while($row = $this->dbObj->fetchRow($qResult))
		{
			$u_id = intval($row["user_id"]);
			$tr_cnt = intval($row["COUNT(*)"]);

			$trCountArr[$u_id] = $tr_cnt;
		}

		$accCountArr = [];
		$qResult = $this->dbObj->selectQ("user_id, owner_id, COUNT(*)", "accounts", NULL, "owner_id");
		while($row = $this->dbObj->fetchRow($qResult))
		{
			$u_id = intval($row["user_id"]);
			$o_id = intval($row["owner_id"]);
			$acc_cnt = intval($row["COUNT(*)"]);

			$accCountArr[$o_id] = $acc_cnt;
		}

		foreach($this->cache as $u_id => $item)
		{
			$userObj = new stdClass;

			$userObj->id = $u_id;
			$userObj->login = $item->login;
			$userObj->access = $item->access;

			$pMod = new PersonModel($u_id);
			$pObj = $pMod->getItem($item->owner_id);
			if (!$pObj)
				throw new Error("Person ".$item->owner_id." not found");

			$userObj->owner = $pObj->name;
			$userObj->accCount = isset($accCountArr[$item->owner_id]) ? $accCountArr[$item->owner_id] : 0;
			$userObj->trCount = isset($trCountArr[$u_id]) ? $trCountArr[$u_id] : 0;
			$userObj->pCount = $pMod->getCount();

			$res[] = $userObj;
		}

		return $res;
	}


	// Delete user and all related data
	protected function preDelete($user_id)
	{
		$u_id = intval($user_id);
		if (!$u_id)
			return FALSE;

		$accMod = new AccountModel($u_id);
		if (!$accMod->reset())
			return FALSE;

		if (!$this->dbObj->deleteQ("persons", "user_id=".$u_id))
			return FALSE;

		return TRUE;
	}
}
