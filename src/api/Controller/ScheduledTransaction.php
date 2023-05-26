<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\ScheduledTransactionModel;
use JezveMoney\App\Model\TransactionModel;

/**
 * Scheduled transactions API controller
 */
class ScheduledTransaction extends ApiListController
{
    protected $requiredFields = [
        "type",
        "src_id",
        "dest_id",
        "src_amount",
        "dest_amount",
        "src_curr",
        "dest_curr",
        "category_id",
        "comment",
        "start_date",
        "end_date",
        "interval_type",
        "interval_step",
        "interval_offset",
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
        "category_id",
        "comment",
        "start_date",
        "end_date",
        "interval_type",
        "interval_step",
        "interval_offset",
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

        $this->model = ScheduledTransactionModel::getInstance();
        TransactionModel::getInstance();

        $this->createErrorMsg = __("ERR_SCHED_TRANS_CREATE");
        $this->updateErrorMsg = __("ERR_SCHED_TRANS_UPDATE");
        $this->deleteErrorMsg = __("ERR_SCHED_TRANS_DELETE");
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
        return [];
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

        return ($trans_type === DEBT && isset($request["person_id"]))
            ? $this->debtRequiredFields
            : $this->requiredFields;
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
}
