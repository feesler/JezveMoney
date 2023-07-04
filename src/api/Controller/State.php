<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\App\API\Factory\TransactionsFactory;
use JezveMoney\Core\ApiController;
use JezveMoney\Core\Model;
use JezveMoney\Core\DBVersion;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\ScheduledTransactionModel;
use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Model\ImportActionModel;
use JezveMoney\App\Model\ImportConditionModel;
use JezveMoney\App\Model\ReminderModel;
use JezveMoney\App\Model\UserModel;
use JezveMoney\App\Model\UserCurrencyModel;
use JezveMoney\App\Model\UserSettingsModel;

/**
 * State API controller
 */
class State extends ApiController
{
    protected static $dataRequestMap = [
        "currency" => "getCurrencies",
        "icons" => "getIcons",
        "accounts" => "getAccounts",
        "persons" => "getPersons",
        "transactions" => "getTransactions",
        "statistics" => "getStatistics",
        "categories" => "getCategories",
        "schedule" => "getSchedule",
        "reminders" => "getReminders",
        "importtemplates" => "getImportTemplates",
        "importrules" => "getImportRules",
        "importconditions" => "getImportConditions",
        "importactions" => "getImportActions",
        "userCurrencies" => "getUserCurrencies",
        "profile" => "getProfile",
        "users" => "getUsers",
    ];

    /**
     * Returns list data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getList(Model $model, array $options = [])
    {
        $autoIncrement = $options["autoIncrement"] ?? false;
        unset($options["autoIncrement"]);

        $res = new \stdClass();
        $res->data = $model->getData($options);
        if ($autoIncrement) {
            $res->autoincrement = $model->autoIncrement();
        }

        return $res;
    }

    /**
     * Returns currencies data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getCurrencies(array $options = [])
    {
        return $this->getList(CurrencyModel::getInstance(), $options);
    }

    /**
     * Returns icons data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getIcons(array $options = [])
    {
        return $this->getList(IconModel::getInstance(), $options);
    }

    /**
     * Returns accounts data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getAccounts(array $options = [])
    {
        $options = array_merge([
            "owner" => "all",
            "visibility" => "all",
        ], $options);

        return $this->getList(AccountModel::getInstance(), $options);
    }

    /**
     * Returns transactions data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getTransactions(array $options = [])
    {
        $autoIncrement = $options["autoIncrement"] ?? false;
        unset($options["autoIncrement"]);

        $factory = TransactionsFactory::getInstance();
        $res = $factory->getList($options);

        if ($autoIncrement) {
            $model = TransactionModel::getInstance();
            $res->autoincrement = $model->autoIncrement();
        }

        return $res;
    }

    /**
     * Returns persons data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getPersons(array $options = [])
    {
        $options = array_merge([
            "visibility" => "all",
        ], $options);

        return $this->getList(PersonModel::getInstance(), $options);
    }

    /**
     * Returns categories data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getCategories(array $options = [])
    {
        return $this->getList(CategoryModel::getInstance(), $options);
    }

    /**
     * Returns schedule data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getSchedule(array $options = [])
    {
        return $this->getList(ScheduledTransactionModel::getInstance(), $options);
    }

    /**
     * Returns scheduled transactions reminders data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getReminders(array $options = [])
    {
        return $this->getList(ReminderModel::getInstance(), $options);
    }

    /**
     * Returns import templates data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getImportTemplates(array $options = [])
    {
        return $this->getList(ImportTemplateModel::getInstance(), $options);
    }

    /**
     * Returns import rules data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getImportRules(array $options = [])
    {
        $options = array_merge([
            "extended" => true,
        ], $options);

        return $this->getList(ImportRuleModel::getInstance(), $options);
    }

    /**
     * Returns import conditions data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getImportConditions(array $options = [])
    {
        return $this->getList(ImportConditionModel::getInstance(), $options);
    }

    /**
     * Returns import actions data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getImportActions(array $options = [])
    {
        return $this->getList(ImportActionModel::getInstance(), $options);
    }

    /**
     * Returns users data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getUsers(array $options = [])
    {
        $this->checkAdminAccess();
        return $this->getList(UserModel::getInstance(), $options);
    }

    /**
     * Returns user currencies data for specified request
     *
     * @param array $options
     *
     * @return object
     */
    protected function getUserCurrencies(array $options = [])
    {
        return $this->getList(UserCurrencyModel::getInstance(), $options);
    }

    /**
     * Returns user profile data
     *
     * @return object
     */
    protected function getProfile()
    {
        $res = new \stdClass();

        $user = $this->uMod->getItem($this->user_id);
        if (!$user) {
            throw new \Error("User not found");
        }

        $model = PersonModel::getInstance();
        $person = $model->getItem($this->owner_id);
        if (!$person) {
            throw new \Error("Person not found");
        }
        $res->login = $user->login;
        $res->user_id = $this->user_id;
        $res->owner_id = $this->owner_id;
        $res->name = $person->name;

        $reminderModel = ReminderModel::getInstance();
        $res->remindersCount = $reminderModel->getScheduledCount();

        $settingsModel = UserSettingsModel::getInstance();
        $settings = $settingsModel->getSettings();
        $res->settings = $settings->getUserData();

        return $res;
    }

    /**
     * Returns id of most frequent currency of latest transactions
     *
     * @param array $transactions
     *
     * @return int
     */
    protected function getMostFrequentCurrency(array $transactions = [])
    {
        $currencies = [];
        foreach ($transactions as $item) {
            if (!isset($currencies[$item->src_curr])) {
                $currencies[$item->src_curr] = 0;
            }
            $currencies[$item->src_curr]++;

            if (!isset($currencies[$item->dest_curr])) {
                $currencies[$item->dest_curr] = 0;
            }
            $currencies[$item->dest_curr]++;
        }
        $currencyId = 0;
        foreach ($currencies as $curr_id => $value) {
            if (!$currencyId || $value > $currencies[$currencyId]) {
                $currencyId = $curr_id;
            }
        }

        if (!$currencyId) {
            $currMod = CurrencyModel::getInstance();
            $currencyId = $currMod->getIdByPos(0);
        }
        if (!$currencyId) {
            throw new \Error("No currencies found");
        }

        return $currencyId;
    }

    /**
     * Returns statistics data
     *
     * @return object
     */
    protected function getStatistics(int $currencyId)
    {
        $transModel = TransactionModel::getInstance();
        $res = $transModel->getHistogramSeries([
            "report" => "currency",
            "curr_id" => $currencyId,
            "type" => EXPENSE,
            "group" => GROUP_BY_WEEK,
            "limit" => 5
        ]);

        return $res;
    }

    /**
     * /api/state/ route handler
     * Returns application state object
     */
    public function index()
    {
        $res = $this->getData([
            "accounts" => ["autoIncrement" => true],
            "persons" => ["autoIncrement" => true],
            "transactions" => ["onPage" => 0, "autoIncrement" => true],
            "schedule" => ["autoIncrement" => true],
            "reminders" => ["autoIncrement" => true],
            "categories" => ["autoIncrement" => true],
            "importtemplates" => ["autoIncrement" => true],
            "importrules" => ["autoIncrement" => true],
            "userCurrencies" => ["autoIncrement" => true],
            "profile" => [],
        ]);

        $this->ok($res);
    }

    /**
     * /api/state/main route handler
     * Returns main view state object
     */
    public function main()
    {
        $res = $this->getData([
            "accounts" => [],
            "persons" => [],
            "transactions" => ["order" => "desc", "onPage" => 5],
            "profile" => [],
        ]);

        // Statistics
        $currencyId = $this->getMostFrequentCurrency($res->transactions->items);
        $res->histogram = $this->getStatistics($currencyId);

        $this->ok($res);
    }

    /**
     * Returns state object for specified request
     *
     * @param array $request array of options
     *
     * @return object|null
     */
    public function getData(array $request = [])
    {
        if (!is_array($request) || !count(array_keys($request))) {
            return null;
        }

        $res = new \stdClass();
        foreach (static::$dataRequestMap as $param => $method) {
            if (isset($request[$param])) {
                $res->$param = $this->$method($request[$param]);
            }
        }

        return $res;
    }

    /**
     * /api/state/version route handler
     * Returns application version
     */
    public function version()
    {
        $dbVer = DBVersion::getInstance();
        $dbVer->autoUpdate();

        $res = [
            "current" => $dbVer->getCurrentVersion(),
            "latest" => $dbVer->getLatestVersion(),
        ];

        $this->ok($res);
    }
}
