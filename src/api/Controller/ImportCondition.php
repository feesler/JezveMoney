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
            $this->fail("No items specified");
        }

        $res = [];
        foreach ($ids as $item_id) {
            $item = $this->model->getItem($item_id);
            if (!$item) {
                $this->fail("Item '$item_id' not found");
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
            $this->fail($defMsg);
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            $this->fail($defMsg);
        }

        $item_id = $this->model->create($reqData);
        if (!$item_id) {
            $this->fail($defMsg);
        }

        if (isset($request["actions"])) {
            $res = $this->actionModel->setRuleActions($item_id, $request["actions"]);
            if (!$res) {
                $this->fail($defMsg);
            }
        }

        $this->ok(["id" => $item_id]);
    }


    protected function update()
    {
        $defMsg = Message::get(ERR_IMPORT_COND_UPDATE);

        if (!$this->isPOST()) {
            $this->fail($defMsg);
        }

        $request = $this->getRequestData();
        if (!$request || !isset($request["id"])) {
            $this->fail($defMsg);
        }

        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            $this->fail($defMsg);
        }

        if (!$this->model->update($request["id"], $reqData)) {
            $this->fail($defMsg);
        }

        if (isset($request["actions"])) {
            $res = $this->actionModel->setRuleActions($request["id"], $request["actions"]);
            if (!$res) {
                $this->fail($defMsg);
            }
        }

        $this->ok();
    }


    protected function del()
    {
        $defMsg = Message::get(ERR_IMPORT_COND_DELETE);

        if (!$this->isPOST()) {
            $this->fail($defMsg);
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            $this->fail("No item specified");
        }

        if (!$this->model->del($ids)) {
            $this->fail($defMsg);
        }

        $this->ok();
    }
}
