<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;
use JezveMoney\Core\JSON;

class Persons extends TemplateController
{
    protected $requiredFields = ["name", "flags"];


    public function index()
    {
        $this->template = new Template(TPL_PATH . "persons.tpl");
        $data = [
            "titleString" => "Jezve Money | Persons",
            "persArr" => [],
            "hiddenPersArr" => [],
        ];

        $personsData = $this->personMod->getData(["type" => "all"]);
        foreach ($personsData as $person) {
            $hidden = $this->personMod->isHidden($person);
            $var = $hidden ? "hiddenPersArr" : "persArr";
            $data[$var][] = [
                "type" => "button",
                "attributes" => ["data-id" => $person->id],
                "title" => $person->name,
            ];
        }

        $data["viewData"] = JSON::encode([
            "persons" => $personsData
        ]);

        $this->cssArr[] = "PersonListView.css";
        $this->jsArr[] = "PersonListView.js";

        $this->render($data);
    }


    private function fail($msg = null)
    {
        if (!is_null($msg)) {
            Message::set($msg);
        }

        setLocation(BASEURL . "persons/");
    }


    public function create()
    {
        if ($this->isPOST()) {
            $this->createPerson();
            return;
        }

        $this->template = new Template(TPL_PATH . "person.tpl");
        $data = [];

        $pInfo = new \stdClass();
        $pInfo->id = 0;
        $pInfo->name = "";
        $pInfo->flags = 0;
        $data["pInfo"] = $pInfo;

        $data["headString"] = "New person";
        $data["titleString"] = "Jezve Money | ".$data["headString"];

        $data["viewData"] = JSON::encode([
            "person" => $pInfo
        ]);

        $this->cssArr[] = "PersonView.css";
        $this->jsArr[] = "PersonView.js";

        $this->render($data);
    }


    public function update()
    {
        if ($this->isPOST()) {
            $this->updatePerson();
        }

        $this->template = new Template(TPL_PATH . "person.tpl");
        $data = [];

        $p_id = intval($this->actionParam);
        if (!$p_id) {
            $this->fail(ERR_PERSON_UPDATE);
        }

        $pInfo = $this->personMod->getItem($p_id);
        if (!$pInfo) {
            $this->fail(ERR_PERSON_UPDATE);
        }
        $data["pInfo"] = $pInfo;

        $data["headString"] = "Edit person";
        $data["titleString"] = "Jezve Money | ".$data["headString"];

        $data["viewData"] = JSON::encode([
            "person" => $pInfo
        ]);

        $this->cssArr[] = "PersonView.css";
        $this->jsArr[] = "PersonView.js";

        $this->render($data);
    }


    protected function createPerson()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "persons/");
        }

        $defMsg = ERR_PERSON_CREATE;

        $reqData = checkFields($_POST, $this->requiredFields);
        if ($reqData === false) {
            $this->fail($defMsg);
        }

        if (!$this->personMod->create($reqData)) {
            $this->fail($defMsg);
        }

        Message::set(MSG_PERSON_CREATE);

        setLocation(BASEURL . "persons/");
    }


    protected function updatePerson()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "persons/");
        }

        $defMsg = ERR_PERSON_UPDATE;

        if (!isset($_POST["id"])) {
            $this->fail($defMsg);
        }

        $reqData = checkFields($_POST, $this->requiredFields);
        if ($reqData === false) {
            $this->fail($defMsg);
        }

        if (!$this->personMod->update($_POST["id"], $reqData)) {
            $this->fail($defMsg);
        }

        Message::set(MSG_PERSON_UPDATE);

        setLocation(BASEURL . "persons/");
    }


    public function show()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "persons/");
        }

        $defMsg = ERR_PERSON_SHOW;

        if (!isset($_POST["persons"])) {
            $this->fail($defMsg);
        }

        $ids = explode(",", rawurldecode($_POST["persons"]));
        if (!$this->personMod->show($ids)) {
            $this->fail($defMsg);
        }

        setLocation(BASEURL . "persons/");
    }


    public function hide()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "persons/");
        }

        $defMsg = ERR_PERSON_HIDE;

        if (!isset($_POST["persons"])) {
            $this->fail($defMsg);
        }

        $ids = explode(",", rawurldecode($_POST["persons"]));
        if (!$this->personMod->hide($ids)) {
            $this->fail($defMsg);
        }

        setLocation(BASEURL . "persons/");
    }


    public function del()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "persons/");
        }

        $defMsg = ERR_PERSON_DELETE;

        if (!isset($_POST["persons"])) {
            $this->fail($defMsg);
        }

        $ids = explode(",", rawurldecode($_POST["persons"]));
        if (!$this->personMod->del($ids)) {
            $this->fail($defMsg);
        }

        Message::set(MSG_PERSON_DELETE);

        setLocation(BASEURL . "persons/");
    }
}
