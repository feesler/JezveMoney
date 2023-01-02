<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Item\CurrencyItem;

class Currency extends ApiListController
{
    protected $requiredFields = ["name", "sign", "flags"];
    protected $model = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->model = CurrencyModel::getInstance();
        $this->createErrorMsg = __("ERR_CURRENCY_CREATE");
        $this->updateErrorMsg = __("ERR_CURRENCY_UPDATE");
        $this->deleteErrorMsg = __("ERR_CURRENCY_DELETE");
    }


    protected function prepareItem($item)
    {
        return new CurrencyItem($item);
    }


    protected function prepareListRequest($request)
    {
        return [];
    }


    public function create()
    {
        $this->checkAdminAccess();
        parent::create();
    }


    public function createMultiple()
    {
        $this->checkAdminAccess();
        parent::createMultiple();
    }


    public function update()
    {
        $this->checkAdminAccess();
        parent::update();
    }


    public function del()
    {
        $this->checkAdminAccess();
        parent::del();
    }
}
