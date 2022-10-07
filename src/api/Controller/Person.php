<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Item\PersonItem;

class Person extends ApiListController
{
    protected $requiredFields = [ "name", "flags" ];


    public function initAPI()
    {
        parent::initAPI();

        $this->model = PersonModel::getInstance();
        $this->createErrorMsg = Message::get(ERR_PERSON_CREATE);
        $this->updateErrorMsg = Message::get(ERR_PERSON_UPDATE);
        $this->deleteErrorMsg = Message::get(ERR_PERSON_DELETE);
    }


    protected function prepareItem($item)
    {
        return new PersonItem($item);
    }

    protected function prepareListRequest($request)
    {
        $res = [];
        if (isset($request["full"]) && $request["full"] == 1) {
            $res["full"] = true;
        }
        if (isset($request["type"])) {
            $res["type"] = $request["type"];
        }

        return $res;
    }


    public function show()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error(Message::get(ERR_NO_IDS));
        }

        $this->begin();

        if (!$this->model->show($ids)) {
            throw new \Error(Message::get(ERR_PERSON_SHOW));
        }

        $this->commit();

        $this->ok();
    }


    public function hide()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error(Message::get(ERR_NO_IDS));
        }

        $this->begin();

        if (!$this->model->hide($ids)) {
            throw new \Error(Message::get(ERR_PERSON_HIDE));
        }

        $this->commit();

        $this->ok();
    }
}
