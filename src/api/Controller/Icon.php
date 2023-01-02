<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Item\IconItem;

class Icon extends ApiListController
{
    protected $requiredFields = ["name", "file", "type"];


    public function initAPI()
    {
        parent::initAPI();

        $this->model = IconModel::getInstance();
        $this->createErrorMsg = __("ERR_ICON_CREATE");
        $this->updateErrorMsg = __("ERR_ICON_UPDATE");
        $this->deleteErrorMsg = __("ERR_ICON_DELETE");
    }


    protected function prepareItem($item)
    {
        return new IconItem($item);
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
