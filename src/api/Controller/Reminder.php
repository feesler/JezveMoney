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
        $this->createErrorMsg = __("ERR_REMINDER_CREATE");
        $this->updateErrorMsg = __("ERR_REMINDER_UPDATE");
        $this->deleteErrorMsg = __("ERR_REMINDER_DELETE");
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
     * Creates multiple items
     */
    public function createMultiple()
    {
        $this->checkAdminAccess();
        parent::createMultiple();
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
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $request = $this->getRequestData();
        if (!$request || !isset($request["id"])) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        $reqData = copyFields($request, ["transaction_id"]);
        if ($reqData === false) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        $this->begin();

        $this->model->confirm($request["id"], $reqData);

        $request = $this->getRequestData();
        $result = $this->getStateResult($request);

        $this->commit();

        $this->ok($result);
    }

    /**
     * Changes state of reminder to 'Cancelled'
     */
    public function cancel()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (!is_array($ids) || count($ids) !== 1) {
            throw new \Error(__("ERR_NO_IDS"));
        }

        $this->begin();

        $this->model->cancel($ids);

        $request = $this->getRequestData();
        $result = $this->getStateResult($request);

        $this->commit();

        $this->ok($result);
    }
}
