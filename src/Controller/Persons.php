<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

class Persons extends TemplateController
{
    protected $requiredFields = ["name", "flags"];


    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "PersonList.tpl");
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

        $data["appProps"] = [
            "persons" => $personsData
        ];

        $this->cssArr[] = "PersonListView.css";
        $this->jsArr[] = "PersonListView.js";

        $this->render($data);
    }


    protected function fail($msg = null)
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

        $this->template = new Template(VIEW_TPL_PATH . "Person.tpl");
        $data = [
            "headString" => "New person",
            "titleString" => "Jezve Money | New person"
        ];

        $personsData = $this->personMod->getData(["type" => "all"]);

        $pInfo = new \stdClass();
        $pInfo->id = 0;
        $pInfo->name = "";
        $pInfo->flags = 0;
        $data["pInfo"] = $pInfo;

        $data["appProps"] = [
            "persons" => $personsData,
            "view" => [
                "person" => $pInfo
            ]
        ];

        $this->cssArr[] = "PersonView.css";
        $this->jsArr[] = "PersonView.js";

        $this->render($data);
    }


    public function update()
    {
        if ($this->isPOST()) {
            $this->updatePerson();
        }

        $this->template = new Template(VIEW_TPL_PATH . "Person.tpl");
        $data = [
            "headString" => "Edit person",
            "titleString" => "Jezve Money | Edit person"
        ];

        $p_id = intval($this->actionParam);
        if (!$p_id) {
            $this->fail(ERR_PERSON_UPDATE);
        }

        $pInfo = $this->personMod->getItem($p_id);
        if (!$pInfo) {
            $this->fail(ERR_PERSON_UPDATE);
        }
        $data["pInfo"] = $pInfo;

        $personsData = $this->personMod->getData(["type" => "all"]);

        $data["appProps"] = [
            "persons" => $personsData,
            "view" => [
                "person" => $pInfo,
            ],
        ];

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
            throw new \Error($defMsg);
        }

        $this->begin();

        if (!$this->personMod->create($reqData)) {
            throw new \Error($defMsg);
        }

        $this->commit();

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
            throw new \Error($defMsg);
        }

        $reqData = checkFields($_POST, $this->requiredFields);
        if ($reqData === false) {
            throw new \Error($defMsg);
        }

        $this->begin();

        if (!$this->personMod->update($_POST["id"], $reqData)) {
            throw new \Error($defMsg);
        }

        $this->commit();

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
            throw new \Error($defMsg);
        }

        $this->begin();

        $ids = explode(",", rawurldecode($_POST["persons"]));
        if (!$this->personMod->show($ids)) {
            throw new \Error($defMsg);
        }

        $this->commit();

        setLocation(BASEURL . "persons/");
    }


    public function hide()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "persons/");
        }

        $defMsg = ERR_PERSON_HIDE;

        if (!isset($_POST["persons"])) {
            throw new \Error($defMsg);
        }

        $this->begin();

        $ids = explode(",", rawurldecode($_POST["persons"]));
        if (!$this->personMod->hide($ids)) {
            throw new \Error($defMsg);
        }

        $this->commit();

        setLocation(BASEURL . "persons/");
    }


    public function del()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "persons/");
        }

        $defMsg = ERR_PERSON_DELETE;

        if (!isset($_POST["persons"])) {
            throw new \Error($defMsg);
        }

        $this->begin();

        $ids = explode(",", rawurldecode($_POST["persons"]));
        if (!$this->personMod->del($ids)) {
            throw new \Error($defMsg);
        }

        $this->commit();

        Message::set(MSG_PERSON_DELETE);
        setLocation(BASEURL . "persons/");
    }
}
