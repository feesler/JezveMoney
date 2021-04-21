<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Item\IconItem;

class Icon extends ApiController
{
    protected $requiredFields = [ "name", "file", "type" ];
    protected $model = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->model = IconModel::getInstance();
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
                throw new \Error("Icon '$item_id' not found");
            }

            $res[] = new IconItem($item);
        }

        $this->ok($res);
    }


    public function getList()
    {
        $res = [];
        $itemsData = $this->model->getData();
        foreach ($itemsData as $item) {
            $res[] = new IconItem($item);
        }

        $this->ok($res);
    }


    protected function create()
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
            throw new \Error(Message::get(ERR_ICON_CREATE));
        }

        $this->ok([ "id" => $item_id ]);
    }


    protected function update()
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
            throw new \Error(Message::get(ERR_ICON_UPDATE));
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
            throw new \Error(Message::get(ERR_ICON_DELETE));
        }

        $this->ok();
    }
}
