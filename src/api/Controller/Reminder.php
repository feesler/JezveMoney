<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\ReminderModel;
use JezveMoney\App\Model\ScheduledTransactionModel;

/**
 * Scheduled transactions reminders API controller
 */
class Reminder extends ApiListController
{
    protected $requiredFields = [
        "schedule_id",
        "state",
        "date",
        "transaction_id",
    ];
    protected $defaultValues = [
        "transaction_id" => 0,
    ];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = ReminderModel::getInstance();
        $this->createErrorMsg = __("reminders.errors.create");
        $this->updateErrorMsg = __("reminders.errors.update");
        $this->deleteErrorMsg = __("reminders.errors.delete");
    }

    /**
     * Creates new item
     */
    public function create()
    {
        $this->checkAdminAccess();
        parent::create();
    }

    /**
     * Updates item
     */
    public function update()
    {
        $this->checkAdminAccess();
        parent::update();
    }

    /**
     * Removes item(s)
     */
    public function del()
    {
        $this->checkAdminAccess();
        parent::del();
    }

    /**
     * Returns array of upcoming reminders
     */
    public function upcoming()
    {
        $requestDefaults = [
            "onPage" => DEFAULT_PAGE_LIMIT,
            "page" => 1,
            "range" => 1,
        ];

        $result = new \stdClass();

        $request = $this->getRequestData();
        $request = array_merge($requestDefaults, $request);

        $scheduleModel = ScheduledTransactionModel::getInstance();

        $request = $scheduleModel->getUpcomingRequestFilters($request);
        $params = $request["params"];

        $reminders = $scheduleModel->getUpcomingReminders($params);

        $result->items = $reminders["items"];
        $result->filter = (object)$request["filter"];
        $result->pagination = $reminders["pagination"];

        $this->ok($result);
    }

    /**
     * Changes state of reminder to 'Confirmed'
     */
    public function confirm()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->runTransaction(function () {
            $request = $this->getRequestData();
            $isUpcoming = isset($request["upcoming"]);
            if (!$request || (!isset($request["id"]) && !$isUpcoming)) {
                throw new \Error(__("errors.invalidRequestData"));
            }

            $reqData = copyFields($request, ["transaction_id"]);
            if ($reqData === false) {
                throw new \Error(__("errors.invalidRequestData"));
            }

            if ($isUpcoming) {
                $this->model->confirmUpcoming($request["upcoming"], $reqData);
            } else {
                $this->model->confirm($request["id"], $reqData);
            }

            $result = $this->getStateResult($request);

            $this->ok($result);
        });
    }

    /**
     * Changes state of reminder to 'Cancelled'
     */
    public function cancel()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->runTransaction(function () {
            $request = $this->getRequestData();
            $isUpcoming = isset($request["upcoming"]);
            if (!$request || (!isset($request["id"]) && !$isUpcoming)) {
                throw new \Error(__("errors.invalidRequestData"));
            }

            if ($isUpcoming) {
                $this->model->cancelUpcoming($request["upcoming"]);
            } else {
                $this->model->cancel($request["id"]);
            }

            $request = $this->getRequestData();
            $result = $this->getStateResult($request);

            $this->ok($result);
        });
    }
}
