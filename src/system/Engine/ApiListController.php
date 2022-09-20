<?php

namespace JezveMoney\Core;

const MSG_NO_IDS = "No ids specified";

class ApiListController extends ApiController
{
    protected $requiredFields = [];
    protected $model = null;
    protected $createErrorMsg = null;
    protected $updateErrorMsg = null;
    protected $deleteErrorMsg = null;

    protected function prepareItem($item)
    {
        return $item;
    }

    public function index()
    {
        $ids = $this->getRequestedIds();
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error(MSG_NO_IDS);
        }

        $res = [];
        foreach ($ids as $item_id) {
            $item = $this->model->getItem($item_id);
            if (is_null($item)) {
                throw new \Error("Item $item_id not found");
            }

            $res[] = $this->prepareItem($item);
        }

        $this->ok($res);
    }


    protected function prepareListRequest($request)
    {
        return $request;
    }


    protected function getListItems($request)
    {
        $items = $this->model->getData($request);
        $res = [];
        foreach ($items as $item) {
            $res[] = $this->prepareItem($item);
        }
        return $res;
    }


    public function getList()
    {
        $data = $this->getRequestData();
        $request = $this->prepareListRequest($data);
        $items = $this->getListItems($request);

        $this->ok($items);
    }


    protected function getExpectedFields($request)
    {
        return $this->requiredFields;
    }


    protected function preCreate($request)
    {
        return $request;
    }


    protected function postCreate($item_id, $request)
    {
    }


    public function create()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        if (!$request) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $expectedFields = $this->getExpectedFields($request);
        $checkResult = checkFields($request, $expectedFields);
        if ($checkResult === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $this->begin();

        $itemData = $this->preCreate($request);

        $item_id = $this->model->create($itemData);
        if (!$item_id) {
            throw new \Error($this->createErrorMsg);
        }

        $this->postCreate($item_id, $request);

        $this->commit();

        $this->ok(["id" => $item_id]);
    }


    public function createMultiple()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        if (!is_array($request)) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $this->begin();

        $items = [];
        foreach ($request as $item) {
            if (!is_array($item)) {
                throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
            }

            $expectedFields = $this->getExpectedFields($item);
            $checkResult = checkFields($item, $expectedFields);
            if ($checkResult === false) {
                throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
            }

            $itemData = $this->preCreate($item);
            $items[] = $itemData;
        }

        $ids = $this->model->createMultiple($items);
        if (!$ids) {
            throw new \Error($this->createErrorMsg);
        }

        $this->postCreate($ids, $request);

        $this->commit();

        $this->ok(["ids" => $ids]);
    }


    protected function preUpdate($request)
    {
        return $request;
    }


    protected function postUpdate($request)
    {
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

        $expectedFields = $this->getExpectedFields($request);
        $reqData = checkFields($request, $expectedFields);
        if ($reqData === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $this->begin();

        $itemData = $this->preUpdate($request);

        if (!$this->model->update($request["id"], $itemData)) {
            throw new \Error($this->updateErrorMsg);
        }

        $this->postUpdate($request);

        $this->commit();

        $this->ok();
    }


    public function del()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error(MSG_NO_IDS);
        }

        $this->begin();

        if (!$this->model->del($ids)) {
            throw new \Error($this->deleteErrorMsg);
        }

        $this->commit();

        $this->ok();
    }
}
