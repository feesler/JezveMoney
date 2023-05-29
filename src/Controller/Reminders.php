<?php

namespace JezveMoney\App\Controller;

use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\ScheduledTransactionModel;
use JezveMoney\App\Model\ReminderModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\UserCurrencyModel;
use JezveMoney\Core\ListViewController;
use JezveMoney\Core\Template;

/**
 * Scheduled transactions reminders controller
 */
class Reminders extends ListViewController
{
    protected $scheduleModel = null;
    protected $accModel = null;
    protected $currModel = null;
    protected $userCurrModel = null;
    protected $catModel = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = ReminderModel::getInstance();
        $this->scheduleModel = ScheduledTransactionModel::getInstance();
        $this->accModel = AccountModel::getInstance();
        $this->currModel = CurrencyModel::getInstance();
        $this->userCurrModel = UserCurrencyModel::getInstance();
        $this->catModel = CategoryModel::getInstance();
        TransactionModel::getInstance();
    }

    /**
     * /reminders/ route handler
     * Renders schedule list view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "ReminderList.tpl");
        $data = [
            "titleString" => __("APP_NAME") . " | " . __("REMINDERS"),
        ];

        $pagination = [
            "onPage" => 10,
            "page" => 1,
            "pagesCount" => 1,
            "total" => 0,
        ];
        $requestDefaults = [
            "onPage" => 10,
            "desc" => true
        ];

        $request = $requestDefaults;

        // Obtain requested view mode
        $showDetails = false;
        if (isset($_GET["mode"]) && $_GET["mode"] == "details") {
            $showDetails = true;
        }

        $itemsCount = $this->model->getCount();
        $pagination["total"] = $itemsCount;

        // Build data for paginator
        if ($request["onPage"] > 0) {
            $pageCount = ceil($itemsCount / $request["onPage"]);
            $pagination["pagesCount"] = $pageCount;
            $page_num = isset($request["page"]) ? intval($request["page"]) : 0;
            $pagination["page"] = $page_num + 1;
        }

        $detailsId = $this->getRequestedItem();

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "categories" => $this->catModel->getData(),
            "schedule" => $this->scheduleModel->getData(),
            "reminders" => $this->model->getData(),
            "view" => [
                "pagination" => $pagination,
                "mode" => $showDetails ? "details" : "classic",
                "detailsId" => $detailsId,
                "detailsItem" => $this->model->getItem($detailsId),
            ],
        ];

        $this->initResources("ReminderListView");
        $this->render($data);
    }
}
