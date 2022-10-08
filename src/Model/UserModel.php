<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\Core\MySqlDB;

use function JezveMoney\Core\qnull;
use function JezveMoney\Core\inSetCondition;

const SECONDS_IN_YEAR = 31536000;
const SECONDS_IN_HOUR = 3600;

class UserModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private $currentUser = null;
    protected $tbl_name = "users";
    protected $personName = null;


    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();
    }


    // Convert DB row to item object
    protected function rowToObj($row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new \stdClass();
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

        return $bfPrefix . substr(md5($str), 0, 21) . "\$";
    }


    // Return hash for specified string and salt
    private function getHash($str, $salt)
    {
        return substr(crypt($str, $salt), 28);
    }


    // Check correctness of hash
    private function checkHash($str, $salt, $hash)
    {
        $full_hash = substr($salt, 0, 28) . $hash;

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
        $user_id = $this->getIdByLogin($login);
        $uObj = $this->getItem($user_id);
        if (!$uObj) {
            return false;
        }

        $salt = $this->getSalt($login);
        $hashed = $this->getHash($password, $salt);

        return $this->checkHash($hashed, $salt, $uObj->passhash);
    }


    // Check correctness of cookies data
    private function checkCookie($login, $passhash)
    {
        $user_id = $this->getIdByLogin($login);
        $uObj = $this->getItem($user_id);
        if (!$uObj) {
            return false;
        }

        $salt = $this->getSalt($login);

        return $this->checkHash($passhash, $salt, $uObj->passhash);
    }


    // Setup cookies
    private function setupCookies($login, $passhash)
    {
        $rememberUser = isset($_SESSION["remember"]);
        if ($rememberUser) {
            $expTime = time() + SECONDS_IN_YEAR;
        } else {
            $expTime = 0;
        }

        setcookie("login", $login, $expTime, APP_PATH, "", isSecure());
        setcookie("passhash", $passhash, $expTime, APP_PATH, "", isSecure());
    }


    // Delete cookies
    private function deleteCookies()
    {
        $expTime = time() - SECONDS_IN_HOUR;    // hour before now

        setcookie("login", "", $expTime, APP_PATH, "", isSecure());
        setcookie("passhash", "", $expTime, APP_PATH, "", isSecure());
    }


    // Check is user logged in and return id
    public function check()
    {
        sessionStart();

        $user_id = 0;

        // check session variable
        if (isset($_SESSION["userid"])) {
            $user_id = intval($_SESSION["userid"]);
            $this->currentUser = $this->getItem($user_id);
            if ($this->currentUser) {
                return $this->currentUser->id;
            } else {
                $this->logout();
                return 0;
            }
        }

        // check cookies
        if (!isset($_COOKIE["login"]) || !isset($_COOKIE["passhash"])) {
            return 0;
        }

        $loginCook = $_COOKIE["login"];
        $passCook = $_COOKIE["passhash"];

        if (!$this->checkCookie($loginCook, $passCook)) {
            $this->deleteCookies();
            return 0;
        }

        $user_id = $this->getIdByLogin($loginCook);
        $_SESSION["userid"] = $user_id;

        $this->setupCookies($loginCook, $passCook);

        $this->currentUser = $this->getItem($user_id);

        return $user_id;
    }


    public function getUserTheme()
    {
        if (!isset($_COOKIE["theme"])) {
            return 0;
        }

        return intval($_COOKIE["theme"]);
    }


    // Check user has admin access
    public function isAdmin($item_id)
    {
        $uObj = $this->getItem($item_id);

        return ($uObj && ($uObj->access & 0x1) == 0x1);
    }


    // Check user has test access
    public function isTester($item_id)
    {
        $uObj = $this->getItem($item_id);

        return ($uObj && ($uObj->access & 0x2) == 0x2);
    }


    // Check current user has admin access
    public static function isAdminUser()
    {
        $uMod = static::getInstance();
        return ($uMod && $uMod->currentUser && ($uMod->currentUser->access & 0x1) == 0x1);
    }


    // Return id of currently logged in user or 0 if no user logged in
    public function getUser()
    {
        if (!$this->currentUser) {
            return 0;
        }

        return $this->currentUser->id;
    }


    // Return id of owner person of currently logged in user or 0 if no user logged in
    public function getOwner()
    {
        if (!$this->currentUser) {
            return 0;
        }

        return $this->currentUser->owner_id;
    }


    // Return user id by specified login
    public function getIdByLogin($login)
    {
        if (!$this->checkCache()) {
            return 0;
        }

        foreach ($this->cache as $u_id => $item) {
            if ($item->login == $login) {
                return $u_id;
            }
        }

        return 0;
    }


    // Set owner person for specified user
    public function setOwner($user_id, $owner_id)
    {
        $u_id = intval($user_id);
        $o_id = intval($owner_id);
        if (!$u_id || !$o_id) {
            return false;
        }

        // check owner is already the same
        $uObj = $this->getItem($u_id);
        if (!$uObj) {
            return false;
        }
        $cur_owner = $uObj->owner_id;
        if ($cur_owner == $o_id) {
            return true;
        }

        // check specified person not own another user
        $qResult = $this->dbObj->selectQ("id", $this->tbl_name, "owner_id=" . $o_id);
        if ($this->dbObj->rowsCount($qResult) > 0) {
            return false;
        }

        $curDate = date("Y-m-d H:i:s");

        if (
            !$this->dbObj->updateQ(
                $this->tbl_name,
                [
                    "owner_id" => $o_id,
                    "updatedate" => $curDate
                ],
                "id=" . qnull($u_id)
            )
        ) {
            return false;
        }

        $this->cleanCache();

        return true;
    }


    // Set password hash for specified user
    public function setPassHash($login, $passhash)
    {
        $elogin = $this->dbObj->escape($login);
        $curDate = date("Y-m-d H:i:s");

        if (
            !$this->dbObj->updateQ(
                $this->tbl_name,
                [
                    "passhash" => $passhash,
                    "updatedate" => $curDate
                ],
                "login=" . qnull($elogin)
            )
        ) {
            return false;
        }

        $this->cleanCache();

        return true;
    }


    protected function validateParams($params, $item_id = 0)
    {
        $avFields = ["login", "password", "name"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["login"])) {
            $res["login"] = $this->dbObj->escape($params["login"]);
            if (is_empty($res["login"])) {
                throw new \Error("Invalid login specified");
            }
        }

        if (isset($params["password"]) && isset($res["login"])) {
            $res["passhash"] = $this->createHash($res["login"], $params["password"]);
            if (is_empty($res["passhash"])) {
                throw new \Error("Invalid password specified");
            }
        }

        if (isset($params["name"])) {
            $res["name"] = $this->dbObj->escape($params["name"]);
            if (is_empty($res["name"])) {
                throw new \Error("Invalid name specified");
            }
        }

        if (isset($params["access"]) && self::isAdminUser()) {
            $res["access"] = intval($params["access"]);
        } else {
            $res["access"] = 0;
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("User with same login already exist");
        }

        return $res;
    }


    // Check same item already exist
    protected function isSameItemExist($params, $item_id = 0)
    {
        if (!is_array($params) || !isset($params["login"])) {
            return false;
        }

        $userId = $this->getIdByLogin($params["login"]);
        return ($userId != 0 && $userId != $item_id);
    }


    protected function preCreate($params, $isMultiple = false)
    {
        $res = $this->validateParams($params);

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
        $p_id = $pMod->create(["name" => $this->personName, "user_id" => $item_id, "flags" => 0]);

        $this->personName = null;

        $this->setOwner($item_id, $p_id);
    }


    protected function preUpdate($item_id, $params)
    {
        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }

        $res = $this->validateParams($params, $item_id);

        $this->personName = $res["name"];
        unset($res["name"]);

        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    protected function postUpdate($item_id)
    {
        $this->cleanCache();

        if (!is_null($this->personName)) {
            $userObj = $this->getItem($item_id);
            if (!$userObj) {
                return;
            }

            $personMod = PersonModel::getInstance();
            $personObj = $personMod->getItem($userObj->owner_id);
            if (!$personObj) {
                $personData = [
                    "name" => $this->personName,
                    "user_id" => $item_id,
                    "flags" => 0
                ];
                $person_id = $personMod->create($personData);
                if (!$person_id) {
                    throw new \Error("Fail to create person for user");
                }

                $this->setOwner($item_id, $person_id);
            } else {
                $personData = [
                    "name" => $this->personName,
                    "user_id" => $item_id
                ];
                if (!$personMod->adminUpdate($userObj->owner_id, $personData)) {
                    throw new \Error("Fail to update person of user");
                }
            }

            $this->personName = null;
        }
    }


    // Loggin in user
    public function login($params)
    {
        if (!is_array($params)) {
            return null;
        }

        $login = $params["login"];
        $password = $params["password"];
        if (!$this->checkLoginData($login, $password)) {
            return false;
        }

        sessionStart();
        $_SESSION["userid"] = $this->getIdByLogin($login);
        if (isset($params["remember"])) {
            $_SESSION["remember"] = true;
        } else {
            unset($_SESSION["remember"]);
        }

        $preHash = $this->createPreHash($login, $password);

        $this->setupCookies($login, $preHash);

        return true;
    }


    // Loggin out user
    public function logout()
    {
        sessionStart();
        session_unset();
        session_destroy();

        $this->currentUser = null;

        $this->deleteCookies();
    }


    // Change user password
    public function changePassword($login, $oldpass, $newpass)
    {
        if (!$login || !$oldpass || !$newpass) {
            return false;
        }

        if (!$this->checkLoginData($login, $oldpass)) {
            return false;
        }

        return $this->setPassword($login, $newpass);
    }


    // Set up new password for user
    public function setPassword($login, $newpass)
    {
        if (!$login || !$newpass) {
            return false;
        }

        $user_id = $this->getIdByLogin($login);

        $passhash = $this->createHash($login, $newpass);
        if (!$this->setPassHash($login, $passhash)) {
            return false;
        }

        $preHash = $this->createPreHash($login, $newpass);

        if ($this->currentUser && $user_id == $this->currentUser->id) {
            $this->setupCookies($login, $preHash);
        }

        return true;
    }


    // Set up new login for user
    public function setLogin($user_id, $login, $password)
    {
        $user_id = intval($user_id);
        if (!$user_id || is_empty($login)) {
            return false;
        }

        // check user is exist
        $uObj = $this->getItem($user_id);
        if (!$uObj) {
            return false;
        }

        if (!$this->checkLoginData($uObj->login, $password)) {
            return false;
        }

        // check current login is not the same
        if ($uObj->login == $login) {
            return true;
        }

        // check no user exist with the same login
        $luser_id = $this->getIdByLogin($login);
        if ($luser_id != 0 && $luser_id != $user_id) {
            return false;
        }

        $passhash = $this->createHash($login, $password);
        $elogin = $this->dbObj->escape($login);
        $curDate = date("Y-m-d H:i:s");

        if (
            !$this->dbObj->updateQ(
                $this->tbl_name,
                [
                    "login" => $elogin,
                    "passhash" => $passhash,
                    "updatedate" => $curDate
                ],
                "id=" . $user_id
            )
        ) {
            return false;
        }

        $this->cleanCache();

        return true;
    }


    // Set up access level for user
    public function setAccess($user_id, $access)
    {
        $user_id = intval($user_id);
        $access = intval($access);
        if (!$user_id) {
            return false;
        }

        // check user is exist
        $uObj = $this->getItem($user_id);
        if (!$uObj) {
            return false;
        }

        // check current access level is not the same
        if ($uObj->access == $access) {
            return true;
        }

        $curDate = date("Y-m-d H:i:s");

        if (
            !$this->dbObj->updateQ(
                $this->tbl_name,
                [
                    "access" => $access,
                    "updatedate" => $curDate
                ],
                "id=" . $user_id
            )
        ) {
            return false;
        }

        $this->cleanCache();

        return true;
    }


    // Return array of users
    public function getData()
    {
        $res = [];

        if (!static::isAdminUser()) {
            return $res;
        }

        if (!$this->checkCache()) {
            return $res;
        }

        $trCountArr = [];
        $qResult = $this->dbObj->selectQ("user_id, COUNT(*)", "transactions", null, "user_id");
        while ($row = $this->dbObj->fetchRow($qResult)) {
            $u_id = intval($row["user_id"]);
            $tr_cnt = intval($row["COUNT(*)"]);

            $trCountArr[$u_id] = $tr_cnt;
        }

        $accCountArr = [];
        $qResult = $this->dbObj->selectQ("user_id, owner_id, COUNT(*)", "accounts", null, "owner_id");
        while ($row = $this->dbObj->fetchRow($qResult)) {
            $u_id = intval($row["user_id"]);
            $o_id = intval($row["owner_id"]);
            $acc_cnt = intval($row["COUNT(*)"]);

            $accCountArr[$o_id] = $acc_cnt;
        }

        $pMod = PersonModel::getInstance();
        foreach ($this->cache as $u_id => $item) {
            $userObj = new \stdClass();

            $userObj->id = $u_id;
            $userObj->login = $item->login;
            $userObj->access = $item->access;
            $userObj->owner_id = $item->owner_id;

            $pObj = $pMod->getItem($item->owner_id);
            $userObj->name = $pObj ? $pObj->name : "No person";

            $userObj->accCount = isset($accCountArr[$item->owner_id]) ? $accCountArr[$item->owner_id] : 0;
            $userObj->trCount = isset($trCountArr[$u_id]) ? $trCountArr[$u_id] : 0;
            $userObj->pCount = $pMod->getCount(["user" => $u_id]);

            $res[] = $userObj;
        }

        return $res;
    }


    // Delete user and all related data
    protected function preDelete($items)
    {
        if (!$this->currentUser) {
            return false;
        }

        if (!static::isAdminUser()) {
            foreach ($items as $item_id) {
                if ($item_id != $this->currentUser->id) {
                    return false;
                }
            }
        }

        $accMod = AccountModel::getInstance();
        if (!$accMod->reset(["users" => $items])) {
            return false;
        }

        $setCond = inSetCondition($items);
        if (is_null($setCond)) {
            return false;
        }

        $tables = ["persons", "import_tpl", "import_rule", "import_act"];
        foreach ($tables as $table) {
            if (!$this->dbObj->deleteQ($table, "user_id" . $setCond)) {
                return false;
            }
        }

        return true;
    }


    protected function postDelete($items)
    {
        if ($this->currentUser && in_array($this->currentUser->id, $items)) {
            $this->logout();
        }
    }
}
