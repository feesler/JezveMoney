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
    protected $requiredFields = ["name", "initbalance", "curr_id", "icon_id", "flags"];
    protected $transModel = null;

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = AccountModel::getInstance();
        $this->transModel = TransactionModel::getInstance();
        $this->createErrorMsg = __("ERR_ACCOUNT_CREATE");
        $this->updateErrorMsg = __("ERR_ACCOUNT_UPDATE");
        $this->deleteErrorMsg = __("ERR_ACCOUNT_DELETE");
        $this->changePosErrorMsg = __("ERR_ACCOUNT_CHANGE_POS");
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
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error(__("ERR_NO_IDS"));
        }

        $this->begin();

        if (!$this->model->show($ids)) {
            throw new \Error(__("ERR_ACCOUNT_SHOW"));
        }

        $this->commit();

        $this->ok();
    }

    /**
     * Hides account(s)
     */
    public function hide()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error(__("ERR_NO_IDS"));
        }

        $this->begin();

        if (!$this->model->hide($ids)) {
            throw new \Error(__("ERR_ACCOUNT_HIDE"));
        }

        $this->commit();

        $this->ok();
    }
}
