<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiSortableListController;
use JezveMoney\App\Model\TransactionModel;

/**
 * Transactions API controller
 */
class Transaction extends ApiSortableListController
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

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = TransactionModel::getInstance();
        $this->createErrorMsg = __("ERR_TRANS_CREATE");
        $this->updateErrorMsg = __("ERR_TRANS_UPDATE");
        $this->deleteErrorMsg = __("ERR_TRANS_DELETE");
        $this->changePosErrorMsg = __("ERR_TRANS_CHANGE_POS");
    }

    /**
     * Returns list request prepared for controller-specific model
     *
     * @param array $request
     *
     * @return array
     */
    protected function prepareListRequest(array $request)
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

    /**
     * Read items list
     */
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

    /**
     * Returns array of mandatory fields
     *
     * @param array $request
     *
     * @return array
     */
    protected function getExpectedFields(array $request)
    {
        $trans_type = intval($request["type"]);

        return ($trans_type == DEBT) ? $this->debtRequiredFields : $this->requiredFields;
    }

    /**
     * Performs controller-specific preparation of create request data
     *
     * @param array $request
     *
     * @return array
     */
    protected function preCreate(array $request)
    {
        $trans_type = intval($request["type"]);
        if ($trans_type == DEBT) {
            return $this->model->prepareDebt($request);
        } else {
            return $request;
        }
    }

    /**
     * Performs controller-specific preparation of update request data
     *
     * @param array $request update request data
     *
     * @return array
     */
    protected function preUpdate(array $request)
    {
        return $this->preCreate($request);
    }

    /**
     * Set category of transaction(s)
     */
    public function setCategory()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, ["id", "category_id"]);
        if ($reqData === false) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        $this->begin();

        if (!$this->model->setCategory($reqData["id"], $reqData["category_id"])) {
            throw new \Error(__("ERR_TRANS_SET_CATEGORY"));
        }

        $this->commit();

        $this->ok();
    }

    /**
     * Returns statistics data
     */
    public function statistics()
    {
        $res = new \stdClass();
        $filterObj = new \stdClass();

        $request = $this->getRequestData();
        $filterObj = $this->model->getHistogramFilters($request);
        $params = [
            "report" => $filterObj->report,
            "type" => $filterObj->type,
        ];

        if ($params["report"] === "currency") {
            $params["curr_id"] = $filterObj->curr_id;
        } elseif ($params["report"] === "account") {
            $params["acc_id"] = $filterObj->acc_id;
        } elseif ($params["report"] === "category") {
            $params["category_id"] = $filterObj->category_id;
        }

        if (isset($filterObj->group)) {
            $groupType = TransactionModel::getHistogramGroupTypeByName($filterObj->group);
            if ($groupType !== false) {
                $params["group"] = $groupType;
            }
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
