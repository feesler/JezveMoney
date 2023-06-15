<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\CurrencyModel;

/**
 * Currencies API controller
 */
class Currency extends ApiListController
{
    protected $model = null;
    protected $requiredFields = ["name", "sign", "precision", "flags"];
    protected $defaultValues = [
        "precision" => 2,
        "flags" => 0,
    ];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = CurrencyModel::getInstance();
        $this->createErrorMsg = __("ERR_CURRENCY_CREATE");
        $this->updateErrorMsg = __("ERR_CURRENCY_UPDATE");
        $this->deleteErrorMsg = __("ERR_CURRENCY_DELETE");
    }

    /**
     * Returns list request prepared for controller-specific model
     *
     * @param array $request
     *
     * @return array
     */
    protected function prepareListRequest(array $request)
    {
        return [];
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
}
