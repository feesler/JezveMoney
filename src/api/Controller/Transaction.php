<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\App\API\Factory\TransactionsFactory;
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
    protected $defaultValues = [
        "category_id" => 0,
        "comment" => "",
    ];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = TransactionModel::getInstance();
        $this->createErrorMsg = __("transactions.errors.create");
        $this->updateErrorMsg = __("transactions.errors.update");
        $this->deleteErrorMsg = __("transactions.errors.delete");
        $this->changePosErrorMsg = __("transactions.errors.changePos");
    }

    /**
     * Read items list
     */
    public function getList()
    {
        $res = new \stdClass();

        $data = $this->getRequestData();

        $factory = TransactionsFactory::getInstance();
        $res = $factory->getList($data);

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
        $trans_type = isset($request["type"]) ? intval($request["type"]) : 0;

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
        $trans_type = isset($request["type"]) ? intval($request["type"]) : 0;
        if ($trans_type == DEBT && isset($request["person_id"])) {
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
        $requiredFields = ["id", "category_id"];

        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $requiredFields, true);

        $this->begin();

        if (!$this->model->setCategory($reqData["id"], $reqData["category_id"])) {
            throw new \Error(__("transactions.errors.setCategory"));
        }

        $result = $this->getStateResult($request);

        $this->commit();

        $this->ok($result);
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
            $params["accounts"] = $filterObj->accounts;
        } elseif ($params["report"] === "category") {
            $params["categories"] = $filterObj->categories;
        }

        if (isset($filterObj->group)) {
            $groupType = TransactionModel::getHistogramGroupTypeByName($filterObj->group);
            if ($groupType !== false) {
                $params["group"] = $groupType;
            }
        }

        if (isset($filterObj->startDate)) {
            $params["startDate"] = $filterObj->startDate;
        }
        if (isset($filterObj->endDate)) {
            $params["endDate"] = $filterObj->endDate;
        }

        $res->histogram = $this->model->getHistogramSeries($params);
        $res->filter = $filterObj;

        $this->ok($res);
    }
}
