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
        ];
        $data["appProps"] = [
            "persons" => $this->personMod->getData(["type" => "all"])
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
            $this->fail(ERR_INVALID_REQUEST);
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
            $this->fail(ERR_INVALID_REQUEST);
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
}
