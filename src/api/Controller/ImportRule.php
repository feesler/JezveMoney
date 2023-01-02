<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportConditionModel;
use JezveMoney\App\Model\ImportActionModel;
use JezveMoney\App\Item\ImportRuleItem;

class ImportRule extends ApiListController
{
    protected $requiredFields = [
        "flags",
        "conditions",
        "actions"
    ];


    public function initAPI()
    {
        parent::initAPI();

        $this->model = ImportRuleModel::getInstance();
        $this->condModel = ImportConditionModel::getInstance();
        $this->actionModel = ImportActionModel::getInstance();
        $this->createErrorMsg = __("ERR_IMPORT_RULE_CREATE");
        $this->updateErrorMsg = __("ERR_IMPORT_RULE_UPDATE");
        $this->deleteErrorMsg = __("ERR_IMPORT_RULE_DELETE");
    }


    protected function prepareItem($item)
    {
        return new ImportRuleItem($item);
    }


    protected function prepareListRequest($request)
    {
        $res = [];
        if (isset($request["full"]) && $request["full"] == true) {
            $res["full"] = true;
        }
        if (isset($request["extended"]) && $request["extended"] == true) {
            $res["extended"] = true;
        }

        return $res;
    }


    protected function getListItems($request)
    {
        return $this->model->getData($request);
    }


    protected function verifyRequest($request)
    {
        if (
            !is_array($request)
            || !isset($request["conditions"])
            || !is_array($request["conditions"])
            || !count($request["conditions"])
            || !isset($request["actions"])
            || !is_array($request["actions"])
            || !count($request["actions"])
        ) {
            return false;
        }

        foreach ($request["conditions"] as $condition) {
            if (!is_array($condition)) {
                return false;
            }
        }

        foreach ($request["actions"] as $action) {
            if (!is_array($action)) {
                return false;
            }
        }

        return true;
    }


    private function setRuleData($ruleId, $data)
    {
        if (!is_array($data)) {
            return false;
        }

        if (isset($data["conditions"])) {
            $res = $this->condModel->setRuleConditions($ruleId, $data["conditions"]);
            if (!$res) {
                return false;
            }
        }

        if (isset($data["actions"])) {
            $res = $this->actionModel->setRuleActions($ruleId, $data["actions"]);
            if (!$res) {
                return false;
            }
        }

        return true;
    }


    protected function preCreate($request)
    {
        if (!$this->verifyRequest($request)) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        return $request;
    }


    protected function postCreate($item_id, $request)
    {
        if (!$this->setRuleData($item_id, $request)) {
            $this->model->del($item_id);
            throw new \Error($this->createErrorMsg);
        }
    }


    protected function preUpdate($request)
    {
        return $this->preCreate($request);
    }


    protected function postUpdate($request)
    {
        if (!$this->setRuleData($request["id"], $request)) {
            throw new \Error($this->updateErrorMsg);
        }
    }
}
