<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\App\Item\ImportTemplateItem;

class ImportTemplate extends ApiController
{
    protected $requiredFields = [
        "name",
        "type_id",
        "date_col",
        "comment_col",
        "trans_curr_col",
        "trans_amount_col",
        "account_curr_col",
        "account_amount_col",
    ];
    protected $model = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->model = ImportTemplateModel::getInstance();
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

            $res[] = new ImportTemplateItem($item);
        }

        $this->ok($res);
    }


    public function getList()
    {
        $res = [];
        $itemsData = $this->model->getData();
        foreach ($itemsData as $item) {
            $res[] = new ImportTemplateItem($item);
        }

        $this->ok($res);
    }


    protected function create()
    {
        $defMsg = ERR_IMPTPL_CREATE;

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

        $this->ok([ "id" => $item_id ]);
    }


    protected function update()
    {
        $defMsg = ERR_IMPTPL_UPDATE;

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

        $this->ok();
    }


    protected function del()
    {
        $defMsg = ERR_IMPTPL_DELETE;

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
