<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Message;

class Persons extends TemplateController
{
    protected $requiredFields = ["name", "flags"];


    public function index()
    {
        $personsData = $this->personMod->getData(["type" => "all"]);
        $persArr = $this->personMod->getData();
        $hiddenPersArr = $this->personMod->getData(["type" => "hidden"]);

        $titleString = "Jezve Money | Persons";

        $this->cssArr[] = "PersonListView.css";
        $this->buildCSS();
        $this->jsArr[] = "PersonListView.js";

        include(TPL_PATH . "persons.tpl");
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

        $pInfo = new \stdClass();
        $pInfo->id = 0;
        $pInfo->name = "";
        $pInfo->flags = 0;

        $titleString = "Jezve Money | ";
        $headString = "New person";
        $titleString .= $headString;

        $this->cssArr[] = "PersonView.css";
        $this->buildCSS();
        $this->jsArr[] = "PersonView.js";

        include(TPL_PATH . "person.tpl");
    }


    public function update()
    {
        if ($this->isPOST()) {
            $this->updatePerson();
        }

        $p_id = intval($this->actionParam);
        if (!$p_id) {
            $this->fail(ERR_PERSON_UPDATE);
        }

        $pObj = $this->personMod->getItem($p_id);
        if (!$pObj) {
            $this->fail(ERR_PERSON_UPDATE);
        }

        $pInfo = clone $pObj;

        $titleString = "Jezve Money | ";
        $headString = "Edit person";
        $titleString .= $headString;

        $this->cssArr[] = "PersonView.css";
        $this->buildCSS();
        $this->jsArr[] = "PersonView.js";

        include(TPL_PATH . "person.tpl");
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
