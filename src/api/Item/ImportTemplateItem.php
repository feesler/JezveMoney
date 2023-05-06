<?php

namespace JezveMoney\App\Item;

class ImportTemplateItem
{
    public $id = 0;
    public $user_id = 0;
    public $name = null;
    public $type_id = 0;
    public $account_id = 0;
    public $first_row = 0;
    public $columns = [];
    public $date_locale = "";
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to ImportTemplateItem object
     *
     * @param array|null $row
     *
     * @return ImportTemplateItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->name = $row["name"];
        $res->user_id = intval($row["user_id"]);
        $res->type_id = intval($row["type_id"]);
        $res->account_id = intval($row["account_id"]);
        $res->first_row = intval($row["first_row"]);
        $res->columns = [
            "date" => intval($row["date_col"]),
            "comment" => intval($row["comment_col"]),
            "transactionCurrency" => intval($row["trans_curr_col"]),
            "transactionAmount" => intval($row["trans_amount_col"]),
            "accountCurrency" => intval($row["account_curr_col"]),
            "accountAmount" => intval($row["account_amount_col"]),
        ];
        $res->date_locale = $row["date_locale"];
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }
}
