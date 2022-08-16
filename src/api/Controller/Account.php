<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Item\AccountItem;

class Account extends ApiListController
{
    protected $requiredFields = ["name", "initbalance", "curr_id", "icon_id", "flags"];

    public function initAPI()
    {
        parent::initAPI();

        $this->model = AccountModel::getInstance();
        $this->createErrorMsg = Message::get(ERR_ACCOUNT_CREATE);
        $this->updateErrorMsg = Message::get(ERR_ACCOUNT_UPDATE);
        $this->deleteErrorMsg = Message::get(ERR_ACCOUNT_DELETE);
    }


    protected function prepareItem($item)
    {
        return new AccountItem($item);
    }


    protected function prepareListRequest($request)
    {
        $res = [];
        if (isset($request["full"]) && $request["full"] == 1) {
            $res["full"] = true;
        }
        if (isset($request["type"])) {
            $res["type"] = $request["type"];
        }

        return $res;
    }


    protected function preCreate($item)
    {
        $res = $item;
        $res["owner_id"] = $this->owner_id;

        return $res;
    }
}
