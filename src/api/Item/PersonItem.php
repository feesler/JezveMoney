<?php

namespace JezveMoney\App\Item;

use JezveMoney\App\Model\AccountModel;

class PersonItem
{
    public $id = 0;
    public $user_id = 0;
    public $name = null;
    public $flags = 0;
    public $accounts = null;
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to PersonItem object
     *
     * @param array|null $row
     *
     * @return PersonItem|null
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
        $res->flags = intval($row["flags"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }

    /**
     * Sets accounts property of item
     *
     * @param array|null $accounts
     */
    public function setAccounts(mixed $accounts)
    {
        if (isset($accounts) && is_array($accounts)) {
            $accData = $accounts;
        } else {
            $accModel = AccountModel::getInstance();
            $accData = $accModel->getData(["owner" => $this->id]);
        }

        $this->accounts = [];
        foreach ($accData as $account) {
            $personAcc = new \stdClass();
            $personAcc->id = $account->id;
            $personAcc->curr_id = $account->curr_id;
            $personAcc->balance = $account->balance;

            $this->accounts[] = $personAcc;
        }
    }
}
