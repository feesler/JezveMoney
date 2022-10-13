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


    public function show()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error(Message::get(ERR_NO_IDS));
        }

        $this->begin();

        if (!$this->model->show($ids)) {
            throw new \Error(Message::get(ERR_ACCOUNT_SHOW));
        }

        $this->commit();

        $this->ok();
    }


    public function hide()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error(Message::get(ERR_NO_IDS));
        }

        $this->begin();

        if (!$this->model->hide($ids)) {
            throw new \Error(Message::get(ERR_ACCOUNT_HIDE));
        }

        $this->commit();

        $this->ok();
    }
}
