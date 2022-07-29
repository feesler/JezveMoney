<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Item\AccountItem;

class Account extends ApiController
{
    protected $requiredFields = ["name", "initbalance", "curr_id", "icon_id", "flags"];
    protected $model = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->model = AccountModel::getInstance();
    }


    public function index()
    {
        $ids = $this->getRequestedIds();
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No account specified");
        }

        $res = [];
        foreach ($ids as $acc_id) {
            $item = $this->model->getItem($acc_id);
            if (is_null($item)) {
                throw new \Error("Account $acc_id not found");
            }

            $res[] = new AccountItem($item);
        }

        $this->ok($res);
    }


    public function getList()
    {
        $params = [];
        if (isset($_GET["full"]) && $_GET["full"] == 1) {
            $params["full"] = true;
        }
        if (isset($_GET["type"])) {
            $params["type"] = $_GET["type"];
        }

        $accounts = $this->model->getData($params);
        $res = [];
        foreach ($accounts as $item) {
            $res[] = new AccountItem($item);
        }

        $this->ok($res);
    }


    public function create()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $this->requiredFields, true);

        $uObj = $this->uMod->getItem($this->user_id);
        if (!$uObj) {
            throw new \Error("User not found");
        }

        $reqData["owner_id"] = $uObj->owner_id;

        $acc_id = $this->model->create($reqData);
        if (!$acc_id) {
            throw new \Error(Message::get(ERR_ACCOUNT_CREATE));
        }

        $this->ok(["id" => $acc_id]);
    }


    public function createMultiple()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $uObj = $this->uMod->getItem($this->user_id);
        if (!$uObj) {
            throw new \Error("User not found");
        }

        $request = $this->getRequestData();
        $accounts = [];
        foreach ($request as $item) {
            if (!is_array($item)) {
                throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
            }

            $item["owner_id"] = $uObj->owner_id;

            $accounts[] = $item;
        }
        $ids = $this->model->createMultiple($accounts);
        if (!$ids) {
            throw new \Error(Message::get(ERR_ACCOUNT_CREATE));
        }

        $this->ok(["ids" => $ids]);
    }


    public function update()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        if (!$request || !isset($request["id"])) {
            throw new \Error("Invalid request data");
        }

        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            throw new \Error("Invalid request data");
        }

        if (!$this->model->update($request["id"], $reqData)) {
            throw new \Error(Message::get(ERR_ACCOUNT_UPDATE));
        }

        $this->ok();
    }


    public function del()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No account specified");
        }

        if (!$this->model->del($ids)) {
            throw new \Error(Message::get(ERR_ACCOUNT_DELETE));
        }

        $this->ok();
    }
}
