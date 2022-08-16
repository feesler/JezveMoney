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
}
