<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\ReminderModel;

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
     * Changes state of reminder to 'Confirmed'
     */
    public function confirm()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->runTransaction(function () {
            $request = $this->getRequestData();
            if (!$request || !isset($request["id"])) {
                throw new \Error(__("errors.invalidRequestData"));
            }

            $reqData = copyFields($request, ["transaction_id"]);
            if ($reqData === false) {
                throw new \Error(__("errors.invalidRequestData"));
            }

            $this->model->confirm($request["id"], $reqData);
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
            $ids = $this->getRequestedIds(true, $this->isJsonContent());
            if (!is_array($ids) || count($ids) === 0) {
                throw new \Error(__("errors.noIds"));
            }

            $this->model->cancel($ids);

            $request = $this->getRequestData();
            $result = $this->getStateResult($request);

            $this->ok($result);
        });
    }
}
