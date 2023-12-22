<?php

namespace JezveMoney\App\Controller;

use JezveMoney\App\Item\AccountItem;
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
            "titleString" => __("appName") . " | " . __("accounts.listTitle"),
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
            $this->fail(__("errors.invalidRequest"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Account.tpl");
        $data = [
            "headString" => __("accounts.create"),
            "titleString" => __("appName") . " | " . __("accounts.create"),
        ];

        $currMod = CurrencyModel::getInstance();
        $userCurrModel = UserCurrencyModel::getInstance();
        $iconModel = IconModel::getInstance();

        $account = new AccountItem();
        $account->id = 0;
        $account->type = 0;
        $account->name = "";
        $account->curr_id = $currMod->getIdByPos(0);
        $account->balance = 0;
        $account->initbalance = "";
        $account->limit = 0;
        $account->initlimit = "";
        $account->icon_id = 0;
        $account->flags = 0;

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->model->getData(["visibility" => "all"]),
            "currency" => $currMod->getData(),
            "userCurrencies" => $userCurrModel->getData(),
            "icons" => $iconModel->getData(),
            "nextAddress" => $this->getNextAddress(),
            "view" => [
                "account" => $account,
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
            $this->fail(__("errors.invalidRequest"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Account.tpl");
        $data = [
            "headString" => __("accounts.update"),
            "titleString" => __("appName") . " | " . __("accounts.update"),
        ];

        $currMod = CurrencyModel::getInstance();
        $userCurrModel = UserCurrencyModel::getInstance();
        $iconModel = IconModel::getInstance();

        $acc_id = intval($this->actionParam);
        if (!$acc_id) {
            $this->fail();
        }

        $account = $this->model->getItem($acc_id);
        if (!$account) {
            $this->fail(__("accounts.errors.update"));
        }

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->model->getData(["visibility" => "all"]),
            "currency" => $currMod->getData(),
            "userCurrencies" => $userCurrModel->getData(),
            "icons" => $iconModel->getData(),
            "nextAddress" => $this->getNextAddress(),
            "view" => [
                "account" => $account,
            ],
        ];

        $this->initResources("AccountView");
        $this->render($data);
    }
}
