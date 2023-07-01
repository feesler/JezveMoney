<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiSortableListController;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\TransactionModel;

/**
 * Accounts API controller
 */
class Account extends ApiSortableListController
{
    protected $transModel = null;
    protected $requiredFields = ["type", "name", "initbalance", "initlimit", "curr_id", "icon_id", "flags"];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = AccountModel::getInstance();
        $this->transModel = TransactionModel::getInstance();
        $this->createErrorMsg = __("accounts.errors.create");
        $this->updateErrorMsg = __("accounts.errors.update");
        $this->deleteErrorMsg = __("accounts.errors.delete");
        $this->changePosErrorMsg = __("accounts.errors.changePos");
    }

    /**
     * Returns array of default field values
     *
     * @param array $item
     *
     * @return array
     */
    protected function getDefaultValues(array $item)
    {
        return [
            "type" => ACCOUNT_TYPE_OTHER,
            "initlimit" => 0,
            "icon_id" => 0,
            "flags" => 0,
        ];
    }

    /**
     * Returns item object prepared for API response
     *
     * @param object $item item object from model
     * @param bool $isList list item flag. Default is false
     *
     * @return object
     */
    protected function prepareItem(object $item, bool $isList = false)
    {
        if ($isList) {
            return $item;
        }

        $res = $item;
        $res->transactionsCount = $this->transModel->getTransCount([
            "accounts" => $item->id,
        ]);

        return $res;
    }

    /**
     * Performs controller-specific preparation of create request data
     *
     * @param array $request
     *
     * @return array
     */
    protected function preCreate(array $request)
    {
        $res = $request;
        $res["owner_id"] = $this->owner_id;

        return $res;
    }

    /**
     * Shows account(s)
     */
    public function show()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->runTransaction(function () {
            $ids = $this->getRequestedIds(true, $this->isJsonContent());
            if (!is_array($ids) || !count($ids)) {
                throw new \Error(__("errors.noIds"));
            }

            if (!$this->model->show($ids)) {
                throw new \Error(__("accounts.errors.show"));
            }

            $request = $this->getRequestData();
            $result = $this->getStateResult($request);

            $this->ok($result);
        });
    }

    /**
     * Hides account(s)
     */
    public function hide()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->runTransaction(function () {
            $ids = $this->getRequestedIds(true, $this->isJsonContent());
            if (!is_array($ids) || !count($ids)) {
                throw new \Error(__("errors.noIds"));
            }

            if (!$this->model->hide($ids)) {
                throw new \Error(__("accounts.errors.hide"));
            }

            $request = $this->getRequestData();
            $result = $this->getStateResult($request);

            $this->ok($result);
        });
    }
}
