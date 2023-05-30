<?php

namespace JezveMoney\App\Model;

use JezveMoney\App\Item\UserItem;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\MySqlDB;

use function JezveMoney\Core\qnull;
use function JezveMoney\Core\inSetCondition;

const SECONDS_IN_YEAR = 31536000;
const SECONDS_IN_HOUR = 3600;

/**
 * User model
 */
class UserModel extends CachedTable
{
    use Singleton;

    private $currentUser = null;
    protected $tbl_name = "users";
    protected $personName = null;

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array|null $row array of table row fields
     *
     * @return UserItem|null
     */
    protected function rowToObj(?array $row)
    {
        return UserItem::fromTableRow($row);
    }

    /**
     * Returns data query object for CachedTable::updateCache()
     *
     * @return \mysqli_result|bool
     */
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name);
    }

    /**
     * Returns salt for specified string
     *
     * @param string $str source string
     *
     * @return string
     */
    private function getSalt(string $str)
    {
        $bfPrefix = "\$2y\$10\$";

        return $bfPrefix . substr(md5($str), 0, 21) . "\$";
    }

    /**
     * Returns hash for specified string and salt
     *
     * @param string $str source string
     * @param string $salt salt
     *
     * @return string
     */
    private function getHash(string $str, string $salt)
    {
        return substr(crypt($str, $salt), 28);
    }

    /**
     * Checks correctness of hash
     *
     * @param string $str source string
     * @param string $salt salt
     * @param string $hash hash to test
     *
     * @return bool
     */
    private function checkHash(string $str, string $salt, string $hash)
    {
        $full_hash = substr($salt, 0, 28) . $hash;

        return (crypt($str, $salt) == $full_hash);
    }

    /**
     * Creates pre hash for login/password pair
     *
     * @param string $login login string
     * @param string $password password string
     *
     * @return string
     */
    private function createPreHash(string $login, string $password)
    {
        $salt = $this->getSalt($login);
        return $this->getHash($password, $salt);
    }

    /**
     * Creates hash for login/password pair
     *
     * @param string $login login string
     * @param string $password password string
     *
     * @return string
     */
    private function createHash(string $login, string $password)
    {
        $salt = $this->getSalt($login);
        $hashed = $this->getHash($password, $salt);

        return $this->getHash($hashed, $salt);
    }

    /**
     * Checks correctness of login/password data
     *
     * @param string $login login string
     * @param string $password password string
     *
     * @return bool
     */
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

    /**
     * Checks correctness of cookies data
     *
     * @param string $login login string
     * @param string $passhash password string
     *
     * @return bool
     */
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

    /**
     * Sets cookies for specified login/password
     *
     * @param string $login login string
     * @param string $passhash password string
     */
    private function setupCookies($login, $passhash)
    {
        if ($this->rememberUser()) {
            $expTime = time() + SECONDS_IN_YEAR;
        } else {
            $expTime = 0;
        }

        setcookie("login", $login, $expTime, APP_PATH, "", isSecure());
        setcookie("passhash", $passhash, $expTime, APP_PATH, "", isSecure());
    }

    /**
     * Removes login/password cookies
     */
    private function deleteCookies()
    {
        $expTime = time() - SECONDS_IN_HOUR;    // hour before now

        setcookie("login", "", $expTime, APP_PATH, "", isSecure());
        setcookie("passhash", "", $expTime, APP_PATH, "", isSecure());
    }

    /**
     * Checks is user logged in and returns id
     *
     * @return int
     */
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

    /**
     * Returns true if user checked 'Remember me' option on login
     *
     * @return bool
     */
    public function rememberUser()
    {
        if (!isset($_COOKIE["remember"])) {
            return false;
        }

        return intval($_COOKIE["remember"]) != 0;
    }

    /**
     * Returns user theme
     *
     * @return int
     */
    public function getUserTheme()
    {
        if (!isset($_COOKIE["theme"])) {
            return 0;
        }

        return intval($_COOKIE["theme"]);
    }

    /**
     * Returns true if user has admin access
     *
     * @param int $item_id user id
     *
     * @return bool
     */
    public function isAdmin(int $item_id)
    {
        $uObj = $this->getItem($item_id);

        return ($uObj && ($uObj->access & 0x1) == 0x1);
    }

    /**
     * Returns true if user has test access
     *
     * @param int $item_id user id
     *
     * @return bool
     */
    public function isTester(int $item_id)
    {
        $uObj = $this->getItem($item_id);

        return ($uObj && ($uObj->access & 0x2) == 0x2);
    }

    /**
     * Returns true if current user has admin access
     *
     * @return bool
     */
    public static function isAdminUser()
    {
        $uMod = static::getInstance();
        return ($uMod && $uMod->currentUser && ($uMod->currentUser->access & 0x1) == 0x1);
    }

    /**
     * Returns id of currently logged in user or 0 if no user logged in
     *
     * @return int
     */
    public function getUser()
    {
        if (!$this->currentUser) {
            return 0;
        }

        return $this->currentUser->id;
    }

    /**
     * Returns id of owner person of currently logged in user or 0 if no user logged in
     *
     * @return int
     */
    public function getOwner()
    {
        if (!$this->currentUser) {
            return 0;
        }

        return $this->currentUser->owner_id;
    }

    /**
     * Returns user id for specified login
     *
     * @param string $login
     *
     * @return int
     */
    public function getIdByLogin(string $login)
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

    /**
     * Sets owner person for specified user
     *
     * @param int $user_id user id
     * @param int $owner_id owner person id
     *
     * @return bool
     */
    public function setOwner(int $user_id, int $owner_id)
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

    /**
     * Sets password hash for specified user
     *
     * @param string $login user login
     * @param string $passhash password hash
     *
     * @return bool
     */
    public function setPassHash(string $login, string $passhash)
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

    /**
     * Validates item fields before to send create/update request to database
     *
     * @param array $params item fields
     * @param int $item_id item id
     *
     * @return array
     */
    protected function validateParams(array $params, int $item_id = 0)
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

    /**
     * Checks same item already exist
     *
     * @param array $params item fields
     * @param int $item_id item id
     *
     * @return bool
     */
    protected function isSameItemExist(array $params, int $item_id = 0)
    {
        if (!is_array($params) || !isset($params["login"])) {
            return false;
        }

        $userId = $this->getIdByLogin($params["login"]);
        return ($userId != 0 && $userId != $item_id);
    }

    /**
     * Checks item create conditions and returns array of expressions
     *
     * @param array $params item fields
     * @param bool $isMultiple flag for multiple create
     *
     * @return array|null
     */
    protected function preCreate(array $params, bool $isMultiple = false)
    {
        $res = $this->validateParams($params);

        $res["owner_id"] = 0;
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $this->personName = $res["name"];
        unset($res["name"]);

        return $res;
    }

    /**
     * Performs final steps after new item was successfully created
     *
     * @param int|int[]|null $item_id id or array of created item ids
     *
     * @return bool
     */
    protected function postCreate(mixed $item_id)
    {
        if (is_null($item_id)) {
            return false;
        }

        $this->cleanCache();

        if (is_array($item_id)) {
            $item_id = $item_id[0];
        }
        $item_id = intval($item_id);

        // Create owner person
        $personModel = PersonModel::getInstance();
        $owner_id = $personModel->create([
            "name" => $this->personName,
            "user_id" => $item_id,
            "flags" => 0,
        ]);
        $this->personName = null;
        $this->setOwner($item_id, $owner_id);

        // Initialize settings
        $settingsModel = UserSettingsModel::getInstance();
        $res = $settingsModel->init($item_id);

        return $res;
    }

    /**
     * Checks update conditions and returns array of expressions
     *
     * @param int $item_id item id
     * @param array $params item fields
     *
     * @return array
     */
    protected function preUpdate(int $item_id, array $params)
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

    /**
     * Performs final steps after item was successfully updated
     *
     * @param int $item_id item id
     *
     * @return bool
     */
    protected function postUpdate(int $item_id)
    {
        $this->cleanCache();

        if (!is_null($this->personName)) {
            $userObj = $this->getItem($item_id);
            if (!$userObj) {
                return false;
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

        return true;
    }

    /**
     * Loggin in user
     *
     * @param array $params user data
     *
     * @return bool
     */
    public function login(array $params)
    {
        if (!is_array($params)) {
            return false;
        }

        $login = $params["login"];
        $password = $params["password"];
        if (!$this->checkLoginData($login, $password)) {
            return false;
        }

        sessionStart();
        $_SESSION["userid"] = $this->getIdByLogin($login);

        $preHash = $this->createPreHash($login, $password);

        $this->setupCookies($login, $preHash);

        return true;
    }

    /**
     * Loggin out user
     */
    public function logout()
    {
        sessionStart();
        session_unset();
        session_destroy();

        $this->currentUser = null;

        $this->deleteCookies();
    }

    /**
     * Changes user password
     *
     * @param string $login login of user
     * @param string $oldpass old password
     * @param string $newpass new password
     *
     * @return bool
     */
    public function changePassword(string $login, string $oldpass, string $newpass)
    {
        if (!$login || !$oldpass || !$newpass) {
            return false;
        }

        if (!$this->checkLoginData($login, $oldpass)) {
            return false;
        }

        return $this->setPassword($login, $newpass);
    }

    /**
     * Sets new password for user
     *
     * @param string $login user login
     * @param string $newpass password
     *
     * @return bool
     */
    public function setPassword(string $login, string $newpass)
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

    /**
     * Sets new login for user
     *
     * @param int $user_id user id
     * @param string $login new login
     * @param string $password password
     *
     * @return bool
     */
    public function setLogin(int $user_id, string $login, string $password)
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

    /**
     * Sets access level for user
     *
     * @param int $user_id user id
     * @param int $access access level
     *
     * @return bool
     */
    public function setAccess(int $user_id, int $access)
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

    /**
     * Returns array of users. Admin access is required
     *
     * @param array $options data filter options
     *
     * @return \stdClass[]
     */
    public function getData(array $options = [])
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

    /**
     * Checks delete conditions and returns bool result
     *
     * @param array $items array of item ids to remove
     *
     * @return bool
     */
    protected function preDelete(array $items)
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

        $setCond = inSetCondition($items);
        if (is_null($setCond)) {
            return false;
        }

        $tables = [
            "user_settings",
            "user_currency",
            "accounts",
            "persons",
            "transactions",
            "scheduled_transactions",
            "reminders",
            "categories",
            "import_tpl",
            "import_rule",
            "import_cond",
            "import_act",
        ];
        foreach ($tables as $table) {
            if (!$this->dbObj->deleteQ($table, "user_id" . $setCond)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Performs final steps after items were successfully removed
     *
     * @param array $items ids array of removed items
     *
     * @return bool
     */
    protected function postDelete(array $items)
    {
        $this->cleanCache();

        if ($this->currentUser && in_array($this->currentUser->id, $items)) {
            $this->logout();
        }

        return true;
    }
}
