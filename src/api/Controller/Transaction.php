<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\TransactionModel;
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
        $defaultParams = [
            "onPage" => 10,
            "page" => 0
        ];

        $res = new \stdClass();
        $params = $this->model->getRequestFilters($_GET, $defaultParams, true);
        $res->filter = (object)$this->model->getFilterObject($params);

        // Order request is available only from API
        if (
            isset($_GET["order"]) &&
            is_string($_GET["order"]) &&
            strtolower($_GET["order"]) == "desc"
        ) {
            $res->order = "desc";
            $params["desc"] = true;
        } else {
            $res->order = "asc";
        }

        if (isset($_GET["count"]) && is_numeric($_GET["count"])) {
            $params["onPage"] = intval($_GET["count"]);
        }

        $items = $this->model->getData($params);
        $res->items = [];
        foreach ($items as $item) {
            $res->items[] = new TransactionItem($item);
        }

        $transCount = $this->model->getTransCount($params);
        $pagesCount = ($params["onPage"] > 0)
            ? ceil($transCount / $params["onPage"])
            : 1;

        $res->pagination = [
            "total" => $transCount,
            "onPage" => $params["onPage"],
            "pagesCount" => $pagesCount,
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
            $trans_id = $this->model->createDebt($reqData);
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

            $transObj = ($item["type"] == DEBT)
                ? $this->model->prepareDebt($item)
                : $item;

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
            if (!$this->model->updateDebt($trans_id, $reqData)) {
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


    public function statistics()
    {
        $currModel = CurrencyModel::getInstance();
        $accModel = AccountModel::getInstance();
        $res = new \stdClass();
        $filterObj = new \stdClass();

        // Filter type
        $byCurrency = (isset($_GET["filter"]) && $_GET["filter"] == "currency");
        $filterObj->filter = $byCurrency ? "currency" : "account";

        // Transaction type
        $trans_type = EXPENSE;
        if (isset($_GET["type"])) {
            $trans_type = TransactionModel::stringToType($_GET["type"]);
            if (!$trans_type) {
                throw new \Error("Invalid transaction type");
            }
        }
        if ($trans_type) {
            $filterObj->type = TransactionModel::typeToString($trans_type);
        }

        // Currency or account
        if ($byCurrency) {
            if (isset($_GET["curr_id"]) && is_numeric($_GET["curr_id"])) {
                $curr_id = intval($_GET["curr_id"]);
                if (!$currModel->isExist($curr_id)) {
                    throw new \Error("Currency not found");
                }
            } else { // try to get first currency
                $curr_id = $currModel->getIdByPos(0);
                if (!$curr_id) {
                    throw new \Error("No currencies available");
                }
            }
            $filterObj->curr_id = $curr_id;
        } else {
            if (isset($_GET["acc_id"]) && is_numeric($_GET["acc_id"])) {
                $acc_id = intval($_GET["acc_id"]);
                if (!$accModel->isExist($acc_id)) {
                    throw new \Error("Account not found");
                }
            } else { // try to get first account of user
                $acc_id = $accModel->getIdByPos(0);
                if (!$acc_id) {
                    throw new \Error("No accounts available");
                }
            }
            $filterObj->acc_id = $acc_id;
        }

        // Group type
        $groupTypes = ["None", "Day", "Week", "Month", "Year"];
        $groupType_id = 0;
        if (isset($_GET["group"])) {
            $requestedGroup = strtolower($_GET["group"]);
            foreach ($groupTypes as $index => $grtype) {
                if ($requestedGroup == strtolower($grtype)) {
                    $groupType_id = $index;
                    break;
                }
            }
            if ($index != 0) {
                $filterObj->group = $requestedGroup;
            }
        }

        $res->histogram = $this->model->getHistogramSeries(
            $byCurrency,
            ($byCurrency ? $filterObj->curr_id : $filterObj->acc_id),
            $trans_type,
            $groupType_id
        );

        $res->filter = $filterObj;

        $this->ok($res);
    }
}
