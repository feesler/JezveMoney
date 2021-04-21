<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportConditionModel;
use JezveMoney\App\Model\ImportActionModel;
use JezveMoney\App\Item\ImportRuleItem;

class ImportRule extends ApiController
{
    protected $requiredFields = [
        "flags"
    ];
    protected $model = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->model = ImportRuleModel::getInstance();
        $this->condModel = ImportConditionModel::getInstance();
        $this->actionModel = ImportActionModel::getInstance();
    }


    public function index()
    {
        $ids = $this->getRequestedIds();
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No items specified");
        }

        $res = [];
        foreach ($ids as $item_id) {
            $item = $this->model->getItem($item_id);
            if (!$item) {
                throw new \Error("Item '$item_id' not found");
            }

            $res[] = new ImportRuleItem($item);
        }

        $this->ok($res);
    }


    public function getList()
    {
        $params = [];
        if (isset($_GET["full"]) && $_GET["full"] == true) {
            $params["full"] = true;
        }
        if (isset($_GET["extended"]) && $_GET["extended"] == true) {
            $params["extended"] = true;
        }

        $res = $this->model->getData($params);

        $this->ok($res);
    }

    private function checkRuleData($data)
    {
        if (
            !is_array($data)
            || !isset($data["conditions"])
            || !is_array($data["conditions"])
            || !count($data["conditions"])
            || !isset($data["actions"])
            || !is_array($data["actions"])
            || !count($data["actions"])
        ) {
            return false;
        }

        foreach ($data["conditions"] as $condition) {
            if (!is_array($condition)) {
                return false;
            }
        }

        foreach ($data["actions"] as $action) {
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

    public function create()
    {
        $defMsg = Message::get(ERR_IMPORT_RULE_CREATE);

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        if (!$this->checkRuleData($request)) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }
        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $item_id = $this->model->create($reqData);
        if (!$item_id) {
            throw new \Error($defMsg);
        }

        if (!$this->setRuleData($item_id, $request)) {
            $this->model->del($item_id);
            throw new \Error($defMsg);
        }

        $this->ok(["id" => $item_id]);
    }


    public function update()
    {
        $defMsg = Message::get(ERR_IMPORT_RULE_UPDATE);

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        if (!$request || !isset($request["id"])) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }
        if (!$this->checkRuleData($request)) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        if (!$this->model->update($request["id"], $reqData)) {
            throw new \Error($defMsg);
        }

        if (!$this->setRuleData($request["id"], $request)) {
            throw new \Error($defMsg);
        }

        $this->ok();
    }


    public function del()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No item specified");
        }

        if (!$this->model->del($ids)) {
            throw new \Error(Message::get(ERR_IMPORT_RULE_DELETE));
        }

        $this->ok();
    }
}
