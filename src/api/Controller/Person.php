<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Item\PersonItem;

class Person extends ApiController
{
    protected $requiredFields = [ "name", "flags" ];
    protected $model = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->model = PersonModel::getInstance();
    }


    public function index()
    {
        $ids = $this->getRequestedIds();
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No persons specified");
        }

        $res = [];
        foreach ($ids as $person_id) {
            $item = $this->model->getItem($person_id);
            if (!$item) {
                throw new \Error("Person $person_id not found");
            }

            $res[] = new PersonItem($item);
        }

        $this->ok($res);
    }


    public function getList()
    {
        $params = [];
        if (isset($_GET["full"]) && $_GET["full"] == 1) {
            $params["full"] = true;
        }
        if (isset($_GET["type"])) {
            $params["type"] = $_GET["type"];
        }

        $res = [];
        $persons = $this->model->getData($params);
        foreach ($persons as $item) {
            $res[] = new PersonItem($item);
        }

        $this->ok($res);
    }


    public function create()
    {
        if (!$this->isPOST()) {
            throw new \Error("Invalid request type");
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            throw new \Error("Invalid request data");
        }

        $p_id = $this->model->create($reqData);
        if (!$p_id) {
            throw new \Error(Message::get(ERR_PERSON_CREATE));
        }

        $this->ok([ "id" => $p_id ]);
    }


    public function update()
    {
        if (!$this->isPOST()) {
            throw new \Error("Invalid request type");
        }

        $request = $this->getRequestData();
        if (!$request || !isset($request["id"])) {
            throw new \Error("Invalid request data");
        }

        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            throw new \Error("Invalid request data");
        }

        if (!$this->model->update($request["id"], $reqData)) {
            throw new \Error(Message::get(ERR_PERSON_UPDATE));
        }

        $this->ok();
    }


    public function del()
    {
        if (!$this->isPOST()) {
            throw new \Error("Invalid request type");
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No persons specified");
        }

        if (!$this->model->del($ids)) {
            throw new \Error(Message::get(ERR_PERSON_DELETE));
        }

        $this->ok();
    }
}
