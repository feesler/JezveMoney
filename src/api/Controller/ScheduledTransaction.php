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

        $this->createErrorMsg = __("schedule.errors.create");
        $this->updateErrorMsg = __("schedule.errors.update");
        $this->deleteErrorMsg = __("schedule.errors.delete");
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

    /**
     * Updates end date of specified scheduled transaction(s) to today
     */
    public function finish()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->runTransaction(function () {
            $request = $this->getRequestData();
            if (!$request || !isset($request["id"])) {
                throw new \Error(__("errors.invalidRequestData"));
            }

            $this->model->finish($request["id"]);
            $result = $this->getStateResult($request);

            $this->ok($result);
        });
    }
}
