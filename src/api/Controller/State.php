<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Model;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\CurrencyModel;

/**
 * State API controller
 */
class State extends ApiController
{
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
        $options = array_merge([
            "onPage" => 0,
        ], $options);

        return $this->getList(TransactionModel::getInstance(), $options);
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
        $res = new \stdClass();
        // Accounts
        $res->accounts = $this->getAccounts(["autoIncrement" => true]);
        // Transactions
        $res->transactions = $this->getTransactions(["autoIncrement" => true]);
        // Persons
        $res->persons = $this->getPersons(["autoIncrement" => true]);
        // Categories
        $res->categories = $this->getCategories(["autoIncrement" => true]);
        // Import templates
        $res->templates = $this->getImportTemplates(["autoIncrement" => true]);
        // Import rules
        $res->rules = $this->getImportRules(["autoIncrement" => true]);
        // User profile
        $res->profile = $this->getProfile();

        $this->ok($res);
    }

    /**
     * /api/state/main route handler
     * Returns main view state object
     */
    public function main()
    {
        $res = new \stdClass();
        // Accounts
        $res->accounts = $this->getAccounts();
        // Transactions
        $res->transactions = $this->getTransactions(["desc" => true, "onPage" => 5]);
        // Persons
        $res->persons = $this->getPersons();
        // Statistics
        $currencyId = $this->getMostFrequentCurrency($res->transactions->data);
        $res->histogram = $this->getStatistics($currencyId);

        $this->ok($res);
    }
}
