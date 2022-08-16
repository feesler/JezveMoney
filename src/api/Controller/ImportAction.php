<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\ImportActionModel;
use JezveMoney\App\Item\ImportActionItem;

class ImportAction extends ApiListController
{
    protected $requiredFields = [
        "rule_id",
        "action_id",
        "value",
    ];


    public function initAPI()
    {
        parent::initAPI();

        $this->model = ImportActionModel::getInstance();
        $this->createErrorMsg = Message::get(ERR_IMPORT_ACT_CREATE);
        $this->updateErrorMsg = Message::get(ERR_IMPORT_ACT_UPDATE);
        $this->deleteErrorMsg = Message::get(ERR_IMPORT_ACT_DELETE);
    }


    protected function prepareItem($item)
    {
        return new ImportActionItem($item);
    }


    protected function prepareListRequest($request)
    {
        $res = [];
        if (isset($request["full"]) && $request["full"] == true) {
            $res["full"] = true;
        }
        if (isset($request["rule"])) {
            $res["rule"] = $request["rule"];
        }

        return $res;
    }


    protected function getListItems($request)
    {
        return $this->model->getData($request);
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
