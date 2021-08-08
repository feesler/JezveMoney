<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\DebtModel;
use JezveMoney\App\Item\TransactionItem;

class Transaction extends ApiController
{
    protected $requiredFields = [
        "type",
        "src_id",
        "dest_id",
        "src_amount",
        "dest_amount",
        "src_curr",
        "dest_curr",
        "date",
        "comment"
    ];
    protected $debtRequiredFields = [
        "type",
        "person_id",
        "acc_id",
        "op",
        "src_amount",
        "dest_amount",
        "src_curr",
        "dest_curr",
        "date",
        "comment"
    ];

    protected $model = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->model = TransactionModel::getInstance();
    }


    public function index()
    {
        $ids = $this->getRequestedIds();
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No transaction specified");
        }

        $res = [];
        foreach ($ids as $trans_id) {
            $item = $this->model->getItem($trans_id);
            if (is_null($item)) {
                throw new \Error("Transaction $trans_id not found");
            }

            $res[] = new TransactionItem($item);
        }

        $this->ok($res);
    }


    public function getList()
    {
        $accMod = AccountModel::getInstance();

        $params = [
            "onPage" => 10,
            "page" => 0
        ];

        $res = new \stdClass();
        $res->filter = [];

        // Obtain requested transaction type filter
        $typeFilter = [];
        if (isset($_GET["type"])) {
            $typeReq = $_GET["type"];
            if (!is_array($typeReq)) {
                $typeReq = [$typeReq];
            }

            foreach ($typeReq as $type_str) {
                $type_id = intval($type_str);
                if (!$type_id) {
                    $type_id = TransactionModel::stringToType($type_str);
                }
                if (is_null($type_id)) {
                    throw new \Error("Invalid type '$type_str'");
                }

                if ($type_id) {
                    $typeFilter[] = $type_id;
                }
            }
            if (count($typeFilter) > 0) {
                $params["type"] = $res->filter["type"] = $typeFilter;
            }
        }

        if (
            isset($_GET["order"]) &&
            is_string($_GET["order"]) &&
            strtolower($_GET["order"]) == "desc"
        ) {
            $res->filter["desc"] = true;
            $params["desc"] = true;
        }

        if (isset($_GET["count"]) && is_numeric($_GET["count"])) {
            $params["onPage"] = intval($_GET["count"]);
        }

        if (isset($_GET["page"]) && is_numeric($_GET["page"])) {
            $params["page"] = intval($_GET["page"]) - 1;
        }

        // Prepare array of requested accounts filter
        $accFilter = [];
        if (isset($_GET["acc_id"])) {
            $accountsReq = $_GET["acc_id"];
            if (!is_array($accountsReq)) {
                $accountsReq = [$accountsReq];
            }
            foreach ($accountsReq as $acc_id) {
                if (!$accMod->isExist($acc_id)) {
                    throw new \Error("Invalid account '$acc_id'");
                }

                $accFilter[] = intval($acc_id);
            }

            if (count($accFilter) > 0) {
                $params["accounts"] = $res->filter["acc_id"] = $accFilter;
            }
        }

        if (isset($_GET["search"])) {
            $params["search"] = $res->filter["search"] = $_GET["search"];
        }

        if (isset($_GET["stdate"]) && isset($_GET["enddate"])) {
            $params["startDate"] = $res->filter["stdate"] = $_GET["stdate"];
            $params["endDate"] = $res->filter["enddate"] = $_GET["enddate"];
        }

        $items = $this->model->getData($params);
        $res->items = [];
        foreach ($items as $item) {
            $res->items[] = new TransactionItem($item);
        }

        $transCount = $this->model->getTransCount($params);
        $res->pagination = [
            "total" => $transCount,
            "onPage" => $params["onPage"],
            "pagesCount" => ceil($transCount / $params["onPage"]),
            "page" => (isset($params["page"]) ? intval($params["page"]) : 0) + 1
        ];

        $this->ok($res);
    }


    public function create()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        if (!$request || !isset($request["type"])) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $trans_type = intval($request["type"]);

        $fieldsToCheck = ($trans_type == DEBT) ? $this->debtRequiredFields : $this->requiredFields;
        $reqData = checkFields($request, $fieldsToCheck);
        if ($reqData === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $trans_id = 0;
        if ($trans_type == DEBT) {
            $debtMod = DebtModel::getInstance();
            $trans_id = $debtMod->create($reqData);
        } else {
            $trans_id = $this->model->create($reqData);
        }

        if (!$trans_id) {
            throw new \Error(Message::get(ERR_TRANS_CREATE));
        }

        $this->ok(["id" => $trans_id]);
    }


    public function createMultiple()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        $transactions = [];
        foreach ($request as $item) {
            if (!is_array($item)) {
                throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
            }

            if ($item["type"] == DEBT) {
                $debtModel = DebtModel::getInstance();
                $debtTrans = $debtModel->prepareTransaction($item);
                $transObj = (array)$debtTrans;
            } else {
                $transObj = $item;
            }

            $transactions[] = $transObj;
        }

        $trans_ids = $this->model->createMultiple($transactions);
        if (!$trans_ids) {
            throw new \Error(Message::get(ERR_TRANS_CREATE));
        }

        $this->ok(["ids" => $trans_ids]);
    }


    public function update()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        if (!$request || !isset($request["id"])) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $trans_id = intval($request["id"]);
        $trans_type = intval($request["type"]);

        $fieldsToCheck = ($trans_type == DEBT) ? $this->debtRequiredFields : $this->requiredFields;
        $reqData = checkFields($request, $fieldsToCheck);
        if ($reqData === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        if ($trans_type == DEBT) {
            $debtMod = DebtModel::getInstance();
            if (!$debtMod->update($trans_id, $reqData)) {
                throw new \Error(Message::get(ERR_DEBT_UPDATE));
            }
        } else {
            if (!$this->model->update($trans_id, $reqData)) {
                throw new \Error(Message::get(ERR_TRANS_UPDATE));
            }
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
            throw new \Error(Message::get(ERR_TRANS_DELETE));
        }

        $this->ok();
    }


    public function setPos()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, ["id", "pos"]);
        if ($reqData === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        if (!$this->model->updatePosition($reqData["id"], $reqData["pos"])) {
            throw new \Error(Message::get(ERR_TRANS_CHANGE_POS));
        }

        $this->ok();
    }
}
