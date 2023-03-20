<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\ListViewController;
use JezveMoney\Core\Message;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Model\UserCurrencyModel;

/**
 * Accounts controller
 */
class Accounts extends ListViewController
{
    protected $requiredFields = ["name", "initbalance", "curr_id", "icon_id", "flags"];

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = AccountModel::getInstance();
    }

    /**
     * /accounts/ route handler
     * Renders accounts list view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "AccountList.tpl");
        $data = [
            "titleString" => __("APP_NAME") . " | " . __("ACCOUNTS"),
        ];

        $currMod = CurrencyModel::getInstance();
        $iconModel = IconModel::getInstance();

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->model->getData(["visibility" => "all"]),
            "currency" => $currMod->getData(),
            "icons" => $iconModel->getData(),
            "view" => [
                "detailsId" => $this->getRequestedItem(),
            ],
        ];

        $this->initResources("AccountListView");
        $this->render($data);
    }

    /**
     * /accounts/create/ route handler
     * Renders create account view
     */
    public function create()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Account.tpl");
        $data = [
            "headString" => __("ACCOUNT_CREATE"),
            "titleString" => __("APP_NAME") . " | " . __("ACCOUNT_CREATE"),
        ];

        $currMod = CurrencyModel::getInstance();
        $userCurrModel = UserCurrencyModel::getInstance();
        $iconModel = IconModel::getInstance();

        $accInfo = new \stdClass();
        $accInfo->id = 0;
        $accInfo->name = "";
        $accInfo->curr_id = $currMod->getIdByPos(0);
        $accInfo->balance = 0;
        $accInfo->initbalance = "";
        $accInfo->icon_id = 0;
        $accInfo->icon = null;
        $accInfo->flags = 0;

        $currObj = $currMod->getItem($accInfo->curr_id);
        if (!$currObj) {
            throw new \Error(__("ERR_CURR_NOT_FOUND"));
        }

        $accInfo->sign = $currObj->sign;
        $data["accInfo"] = $accInfo;

        $data["nextAddress"] = $this->getNextAddress();
        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->model->getData(["visibility" => "all"]),
            "currency" => $currMod->getData(),
            "userCurrencies" => $userCurrModel->getData(),
            "icons" => $iconModel->getData(),
            "view" => [
                "account" => $accInfo,
            ],
        ];

        $this->initResources("AccountView");
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

        setLocation(BASEURL . "accounts/");
    }

    /**
     * /accounts/update/ route handler
     * Renders update account view
     */
    public function update()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Account.tpl");
        $data = [
            "headString" => __("ACCOUNT_UPDATE"),
            "titleString" => __("APP_NAME") . " | " . __("ACCOUNT_UPDATE"),
        ];

        $currMod = CurrencyModel::getInstance();
        $userCurrModel = UserCurrencyModel::getInstance();
        $iconModel = IconModel::getInstance();

        $acc_id = intval($this->actionParam);
        if (!$acc_id) {
            $this->fail();
        }
        $data["acc_id"] = $acc_id;

        $accInfo = $this->model->getItem($acc_id);
        if (!$accInfo) {
            $this->fail(__("ERR_ACCOUNT_UPDATE"));
        }

        $currObj = $currMod->getItem($accInfo->curr_id);
        $accInfo->sign = ($currObj) ? $currObj->sign : null;
        $accInfo->icon = $this->model->getIconFile($acc_id);
        $data["accInfo"] = $accInfo;

        $data["nextAddress"] = $this->getNextAddress();
        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->model->getData(["visibility" => "all"]),
            "currency" => $currMod->getData(),
            "userCurrencies" => $userCurrModel->getData(),
            "icons" => $iconModel->getData(),
            "view" => [
                "account" => $accInfo,
            ],
        ];

        $this->initResources("AccountView");
        $this->render($data);
    }
}
