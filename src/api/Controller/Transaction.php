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
        "category_id",
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
        "category_id",
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
        if (isset($request["range"])) {
            $res->pagination["range"] = intval($request["range"]);
        }

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

        $this->begin();

        if (!$this->model->updatePosition($reqData["id"], $reqData["pos"])) {
            throw new \Error(Message::get(ERR_TRANS_CHANGE_POS));
        }

        $this->commit();

        $this->ok();
    }


    public function statistics()
    {
        $res = new \stdClass();
        $filterObj = new \stdClass();

        $request = $this->getRequestData();
        $filterObj = $this->model->getHistogramFilters($request);

        $byCurrency = $filterObj->report == "currency";
        $params = [
            "report" => $filterObj->report,
            "type" => $filterObj->type,
        ];

        if ($byCurrency) {
            $params["curr_id"] = $filterObj->curr_id;
        } else {
            $params["acc_id"] = $filterObj->acc_id;
        }

        if (isset($filterObj->group)) {
            $params["group"] = TransactionModel::getHistogramGroupTypeByName($filterObj->group);
        }

        if (isset($filterObj->stdate) && isset($filterObj->enddate)) {
            $params["startDate"] = $filterObj->stdate;
            $params["endDate"] = $filterObj->enddate;
        }

        $res->histogram = $this->model->getHistogramSeries($params);
        $res->filter = $filterObj;

        $this->ok($res);
    }
}
