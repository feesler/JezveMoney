<?php

namespace JezveMoney\App\Item;

class UserSettingsItem
{
    public $id = 0;
    public $user_id = 0;
    public $sort_accounts = 0;
    public $sort_persons = 0;
    public $sort_categories = 0;

    /**
     * Converts table row from database to UserSettingsItem object
     *
     * @param array|null $row
     *
     * @return UserSettingsItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->sort_accounts = intval($row["sort_accounts"]);
        $res->sort_persons = intval($row["sort_persons"]);
        $res->sort_categories = intval($row["sort_categories"]);

        return $res;
    }

    /**
     * Returns user settings object for client
     *
     * @return \stdClass
     */
    public function getUserData()
    {
        $res = new \stdClass();
        $res->sort_accounts = $this->sort_accounts;
        $res->sort_persons = $this->sort_persons;
        $res->sort_categories = $this->sort_categories;

        return $res;
    }
}
