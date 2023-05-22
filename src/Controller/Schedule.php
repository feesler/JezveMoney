<?php

namespace JezveMoney\App\Controller;

use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\ScheduledTransactionModel;
use JezveMoney\App\Model\UserCurrencyModel;
use JezveMoney\Core\ListViewController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

/**
 * Schedule controller
 */
class Schedule extends ListViewController
{
    protected $accModel = null;
    protected $currModel = null;
    protected $userCurrModel = null;
    protected $catModel = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = ScheduledTransactionModel::getInstance();
        $this->accModel = AccountModel::getInstance();
        $this->currModel = CurrencyModel::getInstance();
        $this->userCurrModel = UserCurrencyModel::getInstance();
        $this->catModel = CategoryModel::getInstance();
    }

    /**
     * /schedule/ route handler
     * Renders schedule list view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "Schedule.tpl");
        $data = [
            "titleString" => __("APP_NAME") . " | " . __("SCHEDULE"),
        ];

        $detailsId = $this->getRequestedItem();

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "categories" => $this->catModel->getData(),
            "schedule" => $this->model->getData(),
            "view" => [
                "detailsId" => $detailsId,
                "detailsItem" => $this->model->getItem($detailsId),
            ],
        ];

        $this->initResources("ScheduleView");
        $this->render($data);
    }

    /**
     * Controller error handler
     *
     * @param string|null $msg message string
     */
    protected function fail(?string $msg = null)
    {
        if (!is_null($msg)) {
            Message::setError($msg);
        }

        setLocation(BASEURL . "schedule/");
    }
}
