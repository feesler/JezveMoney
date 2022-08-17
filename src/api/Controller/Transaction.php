<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Item\TransactionItem;

class Transaction extends ApiListController
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


    public function initAPI()
    {
        parent::initAPI();

        $this->model = TransactionModel::getInstance();
        $this->createErrorMsg = Message::get(ERR_TRANS_CREATE);
        $this->updateErrorMsg = Message::get(ERR_TRANS_UPDATE);
        $this->deleteErrorMsg = Message::get(ERR_TRANS_DELETE);
    }


    protected function prepareItem($item)
    {
        return new TransactionItem($item);
    }


    protected function prepareListRequest($request)
    {
        $defaultParams = [
            "onPage" => 10,
            "page" => 0
        ];

        $res = $this->model->getRequestFilters($request, $defaultParams, true);

        // Order request is available only from API
        if (
            isset($request["order"]) &&
            is_string($request["order"]) &&
            strtolower($request["order"]) == "desc"
        ) {
            $res["desc"] = true;
        }

        if (isset($request["count"]) && is_numeric($request["count"])) {
            $res["onPage"] = intval($request["count"]);
        }

        return $res;
    }


    public function getList()
    {
        $res = new \stdClass();

        $data = $this->getRequestData();
        $request = $this->prepareListRequest($data);

        $res->items = $this->getListItems($request);
        $res->filter = (object)$this->model->getFilterObject($request);
        $res->order = (isset($request["desc"]) && $request["desc"] === true)
            ? "desc"
            : "asc";

        $transCount = $this->model->getTransCount($request);
        $pagesCount = ($request["onPage"] > 0)
            ? ceil($transCount / $request["onPage"])
            : 1;

        $currentPage = (isset($request["page"]) ? intval($request["page"]) : 0) + 1;
        $res->pagination = [
            "total" => $transCount,
            "onPage" => $request["onPage"],
            "pagesCount" => $pagesCount,
            "page" => $currentPage
        ];

        $this->ok($res);
    }


    protected function getExpectedFields($request)
    {
        $trans_type = intval($request["type"]);

        return ($trans_type == DEBT) ? $this->debtRequiredFields : $this->requiredFields;
    }


    protected function preCreate($request)
    {
        $trans_type = intval($request["type"]);
        if ($trans_type == DEBT) {
            return $this->model->prepareDebt($request);
        } else {
            return $request;
        }
    }


    protected function preUpdate($request)
    {
        return $this->preCreate($request);
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
        $params["filter"] = $byCurrency ? "currency" : "account";
        $filterObj->filter = $params["filter"];

        // Transaction type
        $trans_type = EXPENSE;
        if (isset($_GET["type"])) {
            $trans_type = TransactionModel::stringToType($_GET["type"]);
            if (!$trans_type) {
                throw new \Error("Invalid transaction type");
            }
        }
        $filterObj->type = TransactionModel::typeToString($trans_type);
        $params["type"] = $trans_type;

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
            $params["curr_id"] = $curr_id;
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
            $params["acc_id"] = $acc_id;
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
                $params["group"] = $groupType_id;
                $filterObj->group = $requestedGroup;
            }
        }

        $stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : null);
        $endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : null);
        if (!is_null($stDate) && !is_null($endDate)) {
            $params["startDate"] = $stDate;
            $params["endDate"] = $endDate;
            $filterObj->stdate = $stDate;
            $filterObj->enddate = $endDate;
        }

        $res->histogram = $this->model->getHistogramSeries($params);
        $res->filter = $filterObj;

        $this->ok($res);
    }
}
