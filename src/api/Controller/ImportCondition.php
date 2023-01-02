<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\ImportConditionModel;
use JezveMoney\App\Item\ImportConditionItem;

class ImportCondition extends ApiListController
{
    protected $requiredFields = [
        "rule_id",
        "field_id",
        "operator",
        "value",
        "flags"
    ];
    protected $model = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->model = ImportConditionModel::getInstance();
        $this->createErrorMsg = __("ERR_IMPORT_COND_CREATE");
        $this->updateErrorMsg = __("ERR_IMPORT_COND_UPDATE");
        $this->deleteErrorMsg = __("ERR_IMPORT_COND_DELETE");
    }


    protected function prepareItem($item)
    {
        return new ImportConditionItem($item);
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
