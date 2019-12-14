<?php

class UserModel extends CachedTable
{
	use Singleton;

	static private $dcache = NULL;
	public $currentUser = NULL;


	protected function onStart()
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
		$uObj = $this->getItem($this->getIdByLogin($login));
		if (!$uObj)
			return FALSE;

		$salt = $this->getSalt($login);
		$hashed = $this->getHash($password, $salt);

		return $this->checkHash($hashed, $salt, $uObj->passhash);
	}


	// Check correctness of cookies data
	private function checkCookie($login, $passhash)
	{
		$uObj = $this->getItem($this->getIdByLogin($login));
		if (!$uObj)
			return FALSE;

		$salt = $this->getSalt($login);

		return $this->checkHash($passhash, $salt, $uObj->passhash);
	}


	// Setup cookies
	private function setupCookies($login, $passhash)
	{
		$expTime = time() + 31536000;	// year after now

		setcookie("login", $login, $expTime, APPPATH, APPDOMAIN, isSecure() ? 1 : 0);
		setcookie("passhash", $passhash, $expTime, APPPATH, APPDOMAIN, isSecure() ? 1 : 0);
	}


	// Delete cookies
	private function deleteCookies()
	{
		$expTime = time() - 3600;	// hour before now

		setcookie("login", "", $expTime, APPPATH, APPDOMAIN, isSecure() ? 1 : 0);
		setcookie("passhash", "", $expTime, APPPATH, APPDOMAIN, isSecure() ? 1 : 0);
	}


	// Check is user logged in and return id
	public function check()
	{
		sessionStart();

		$user_id = 0;

		// check session variable
		if (isset($_SESSION["userid"]))
		{
			$user_id = intval($_SESSION["userid"]);
			$this->currentUser = $this->getItem($user_id);
			return $user_id;
		}

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

		$this->currentUser = $this->getItem($user_id);

		return $user_id;
	}


	// Check user has admin access
	public function isAdmin($item_id)
	{
		$uObj = $this->getItem($item_id);

		return ($uObj && ($uObj->access & 0x1) == 0x1);
	}


	// Check current user has admin access
	static function isAdminUser()
	{
		$uMod = static::getInstance();
		return ($uMod && $uMod->currentUser && ($uMod->currentUser->access & 0x1) == 0x1);
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

		$pMod = PersonModel::getInstance();
		$p_id = $pMod->create([ "name" => $this->personName, "user_id" => $item_id ]);

		unset($this->personName);

		$this->setOwner($item_id, $p_id);
	}


	protected function preUpdate($item_id, $params)
	{
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

		unset($this->currentUser);
		$this->currentUser = NULL;

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
		$uObj = $this->getItem($user_id);
		if (!$uObj)
			return FALSE;

		// check current login is not the same
		if ($uObj->login == $login)
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


	// Set up access level for user
	public function setAccess($user_id, $access)
	{
		$user_id = intval($user_id);
		$access = intval($access);
		if (!$user_id)
			return FALSE;

		// check user is exist
		$uObj = $this->getItem($user_id);
		if (!$uObj)
			return FALSE;

		// check current access level is not the same
		if ($uObj->access == $access)
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
	public function getData()
	{
		$res = [];

		if (!static::isAdminUser())
			return $res;

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

		$pMod = PersonModel::getInstance();
		foreach($this->cache as $u_id => $item)
		{
			$userObj = new stdClass;

			$userObj->id = $u_id;
			$userObj->login = $item->login;
			$userObj->access = $item->access;

			$pObj = $pMod->getItem($item->owner_id);
			$userObj->owner = $pObj ? $pObj->name : "No person";

			$userObj->accCount = isset($accCountArr[$item->owner_id]) ? $accCountArr[$item->owner_id] : 0;
			$userObj->trCount = isset($trCountArr[$u_id]) ? $trCountArr[$u_id] : 0;
			$userObj->pCount = $pMod->getCount([ "user" => $u_id ]);

			$res[] = $userObj;
		}

		return $res;
	}


	// Delete user and all related data
	protected function preDelete($items)
	{
		$accMod = AccountModel::getInstance();
		if (!$accMod->reset($items))
			return FALSE;

		$setCond = inSetCondition($items);
		if (is_null($setCond))
			return FALSE;

		if (!$this->dbObj->deleteQ("persons", "user_id".$setCond))
			return FALSE;

		return TRUE;
	}
}
