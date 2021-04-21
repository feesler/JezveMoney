<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
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
            throw new \Error("No items specified");
        }

        $res = [];
        foreach ($ids as $item_id) {
            $item = $this->model->getItem($item_id);
            if (!$item) {
                throw new \Error("Item '$item_id' not found");
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


    public function create()
    {
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
            throw new \Error(Message::get(ERR_IMPTPL_CREATE));
        }

        $this->ok([ "id" => $item_id ]);
    }


    public function update()
    {
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
            throw new \Error(Message::get(ERR_IMPTPL_UPDATE));
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
            throw new \Error(Message::get(ERR_IMPTPL_DELETE));
        }

        $this->ok();
    }
}
