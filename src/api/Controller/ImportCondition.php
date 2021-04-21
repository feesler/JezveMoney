<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\ImportConditionModel;
use JezveMoney\App\Item\ImportConditionItem;

class ImportCondition extends ApiController
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

            $res[] = new ImportConditionItem($item);
        }

        $this->ok($res);
    }


    public function getList()
    {
        $params = [];
        if (isset($_GET["full"]) && $_GET["full"] == true) {
            $params["full"] = true;
        }
        if (isset($_GET["rule"])) {
            $params["rule"] = $_GET["rule"];
        }

        $res = $this->model->getData($params);

        $this->ok($res);
    }


    protected function create()
    {
        $defMsg = Message::get(ERR_IMPORT_COND_CREATE);

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $item_id = $this->model->create($reqData);
        if (!$item_id) {
            throw new \Error($defMsg);
        }

        if (isset($request["actions"])) {
            $res = $this->actionModel->setRuleActions($item_id, $request["actions"]);
            if (!$res) {
                throw new \Error($defMsg);
            }
        }

        $this->ok(["id" => $item_id]);
    }


    protected function update()
    {
        $defMsg = Message::get(ERR_IMPORT_COND_UPDATE);

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        if (!$request || !isset($request["id"])) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        if (!$this->model->update($request["id"], $reqData)) {
            throw new \Error($defMsg);
        }

        if (isset($request["actions"])) {
            $res = $this->actionModel->setRuleActions($request["id"], $request["actions"]);
            if (!$res) {
                throw new \Error($defMsg);
            }
        }

        $this->ok();
    }


    protected function del()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No item specified");
        }

        if (!$this->model->del($ids)) {
            throw new \Error(Message::get(ERR_IMPORT_COND_DELETE));
        }

        $this->ok();
    }
}
