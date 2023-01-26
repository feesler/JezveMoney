<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\UserSettingsItem;

define("SORT_BY_CREATEDATE_ASC", 1);
define("SORT_BY_CREATEDATE_DESC", 2);
define("SORT_BY_NAME_ASC", 3);
define("SORT_BY_NAME_DESC", 4);
define("SORT_MANUALLY", 5);

const AVAIL_SORT_TYPES = [
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
];

const AVAIL_SORT_SETTINGS = ["sort_accounts", "sort_persons", "sort_categories"];

const DEFAULT_SETTINGS = [
    "sort_accounts" => SORT_BY_CREATEDATE_ASC,
    "sort_persons" => SORT_BY_CREATEDATE_ASC,
    "sort_categories" => SORT_BY_CREATEDATE_ASC,
];

/**
 * User settings model
 */
class UserSettingsModel extends CachedTable
{
    use Singleton;

    private static $user_id = 0;

    protected $tbl_name = "user_settings";

    /**
     * Returns array of available settings
     *
     * @return string[]
     */
    public static function getAvailableSettings()
    {
    }

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

        $this->dbObj = MySqlDB::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array|null $row array of table row fields
     *
     * @return UserSettingsItem|null
     */
    protected function rowToObj(?array $row)
    {
        return UserSettingsItem::fromTableRow($row);
    }

    /**
     * Returns data query object for CachedTable::updateCache()
     *
     * @return \mysqli_result|bool
     */
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=" . self::$user_id);
    }

    /**
     * Validates sort type value
     *
     * @param mixed $value
     *
     * @return int
     */
    protected function validateSortType(mixed $value)
    {
        if (!is_numeric($value)) {
            throw new \Error("Invalid sort type");
        }

        $sortType = intval($value);
        if (!in_array($sortType, AVAIL_SORT_TYPES)) {
            throw new \Error("Invalid sort type");
        }

        return $sortType;
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
        $avFields = AVAIL_SORT_SETTINGS;
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        foreach (AVAIL_SORT_SETTINGS as $settingsName) {
            if (array_key_exists($settingsName, $params)) {
                $res[$settingsName] = $this->validateSortType($params[$settingsName]);
            }
        }

        // Registration
        if (isset($params["user_id"])) {
            $res["user_id"] = intval($params["user_id"]);
            if (
                !$res["user_id"]
                || (self::$user_id
                    && $res["user_id"] != self::$user_id && !UserModel::isAdminUser()
                )
            ) {
                throw new \Error("Invalid user_id");
            }
        } elseif (self::$user_id) {
            $res["user_id"] = self::$user_id;
        } else {
            throw new \Error("Can't obtain user_id");
        }

        return $res;
    }

    /**
     * Checks item create conditions and returns array of expressions
     *
     * @param array $params item fields
     *
     * @return array|null
     */
    protected function preCreate(array $params, bool $isMultiple = false)
    {
        $settings = $this->getSettings();
        if (!is_null($settings)) {
            throw new \Error("Settings for user already exists");
        }

        $res = $this->validateParams($params);

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
        if ($item->user_id != self::$user_id) {
            throw new \Error("Invalid user");
        }

        $settings = $this->getSettings();
        if (is_null($settings)) {
            throw new \Error("Settings for user not exists");
        }
        if ($settings->id != $item_id) {
            throw new \Error("Invalid settings id");
        }

        $res = $this->validateParams($params, $item_id);

        return $res;
    }

    /**
     * Returns array of user settings
     *
     * @param array $params options array:
     *     - 'full' => (bool) - returns settings of all users, admin only
     *
     * @return UserSettingsItem[]
     */
    public function getData(array $params = [])
    {
        $requestAll = (isset($params["full"]) && $params["full"] == true && UserModel::isAdminUser());

        $items = [];
        if ($requestAll) {
            $qResult = $this->dbObj->selectQ("*", $this->tbl_name, null, null, "id ASC");
            while ($row = $this->dbObj->fetchRow($qResult)) {
                $itemObj = $this->rowToObj($row);
                if ($itemObj) {
                    $items[] = $itemObj;
                }
            }
        } else {
            if (!$this->checkCache()) {
                return null;
            }

            $items = $this->cache;
        }

        $res = [];
        foreach ($items as $item) {
            $res[] = clone $item;
        }

        return $res;
    }

    /**
     * Initializes user settings on registration
     *
     * @param int $user_id
     *
     * @return bool
     */
    public function init(int $user_id)
    {
        $params = array_merge([
            "user_id" => $user_id,
        ], DEFAULT_SETTINGS);

        return $this->create($params);
    }

    /**
     * Returns settings for current user
     *
     * @return UserSettingsItem|null
     */
    public function getSettings()
    {
        if (!self::$user_id) {
            return null;
        }

        $data = $this->getData();
        return (is_array($data) && count($data) === 1) ? $data[0] : null;
    }

    /**
     * Updates settings of current user
     *
     * @param array $data array of settings
     *
     * @return bool
     */
    public function updateSettings(array $data)
    {
        $settings = $this->getSettings();
        if (is_null($settings)) {
            throw new \Error("Settings not available");
        }

        return $this->update($settings->id, $data);
    }
}
