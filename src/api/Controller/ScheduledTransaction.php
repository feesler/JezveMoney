<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\ScheduledTransactionModel;

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
}
