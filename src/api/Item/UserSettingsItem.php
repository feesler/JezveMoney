<?php

namespace JezveMoney\App\Item;

class UserSettingsItem
{
    public $id = 0;
    public $user_id = 0;
    public $sort_accounts = 0;
    public $sort_persons = 0;
    public $sort_categories = 0;
    public $date_locale = "en";
    public $decimal_locale = "en";
    public $tr_group_by_date = 0;
    public $tz_offset = 0;
    public $rem_group_by_date = 0;

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
        $res->date_locale = $row["date_locale"];
        $res->decimal_locale = $row["decimal_locale"];
        $res->tr_group_by_date = intval($row["tr_group_by_date"]);
        $res->tz_offset = intval($row["tz_offset"]);
        $res->rem_group_by_date = intval($row["rem_group_by_date"]);

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
        $res->date_locale = $this->date_locale;
        $res->decimal_locale = $this->decimal_locale;
        $res->tr_group_by_date = $this->tr_group_by_date;
        $res->tz_offset = $this->tz_offset;
        $res->rem_group_by_date = $this->rem_group_by_date;

        return $res;
    }
}
