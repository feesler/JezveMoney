<?php

namespace JezveMoney\App\Controller;

use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\Core\ListViewController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

/**
 * Persons controller
 */
class Persons extends ListViewController
{
    protected $requiredFields = ["name", "flags"];

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = $this->personMod;
    }

    /**
     * /persons/ route handler
     * Renders persons list view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "PersonList.tpl");
        $data = [
            "titleString" => __("APP_NAME") . " | " . __("PERSONS"),
        ];

        $currMod = CurrencyModel::getInstance();

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "currency" => $currMod->getData(),
            "persons" => $this->model->getData(["visibility" => "all"]),
            "view" => [
                "detailsId" => $this->getRequestedItem(),
            ],
        ];

        $this->cssArr[] = "PersonListView.css";
        $this->jsArr[] = "PersonListView.js";

        $this->render($data);
    }

    /**
     * Controller error handler
     *
     * @param string|null $msg message string
     */
    protected function fail(?string $msg = null)
    {
        if (!is_null($msg)) {
            Message::setError($msg);
        }

        setLocation(BASEURL . "persons/");
    }

    /**
     * /persons/create/ route handler
     * Renders create person view
     */
    public function create()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Person.tpl");
        $data = [
            "headString" => __("PERSON_CREATE"),
            "titleString" => __("APP_NAME") . " | " . __("PERSON_CREATE"),
        ];

        $personsData = $this->model->getData(["visibility" => "all"]);

        $pInfo = new \stdClass();
        $pInfo->id = 0;
        $pInfo->name = "";
        $pInfo->flags = 0;
        $data["pInfo"] = $pInfo;

        $data["nextAddress"] = $this->getNextAddress();
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

    /**
     * /persons/update/ route handler
     * Renders update person view
     */
    public function update()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Person.tpl");
        $data = [
            "headString" => __("PERSON_UPDATE"),
            "titleString" => __("APP_NAME") . " | " . __("PERSON_UPDATE"),
        ];

        $p_id = intval($this->actionParam);
        if (!$p_id) {
            $this->fail(__("ERR_PERSON_UPDATE"));
        }

        $pInfo = $this->model->getItem($p_id);
        if (!$pInfo) {
            $this->fail(__("ERR_PERSON_UPDATE"));
        }
        $data["pInfo"] = $pInfo;

        $personsData = $this->model->getData(["visibility" => "all"]);

        $data["nextAddress"] = $this->getNextAddress();
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
