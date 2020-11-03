<?php

namespace JezveMoney\Core;

use JezveMoney\Core\Controller;
use JezveMoney\App\Model\UserModel;
use JezveMoney\App\Model\PersonModel;

abstract class TemplateController extends Controller
{
    public $action = null;
    public $actionParam = null;
    protected $cssArr = null;
    protected $css = null;
    protected $jsArr = null;
    protected $uMod = null;
    protected $personMod = null;
    protected $user_name = null;
    protected $user_id = 0;
    protected $owner_id = 0;


    abstract public function index();

    protected function onStart()
    {
    }


    public function initDefResources()
    {
        $this->css = new \stdClass();
        $this->css->clear = ["lib/common.css"];
        $this->css->libs = ["lib/popup.css"];
        $this->css->app = ["app.css"];
        $this->css->page = [];

        $this->jsArr = [
            "lib/polyfill.min.js",
            "lib/common.js",
            "lib/ajax.js",
            "lib/popup.js",
            "app.js"
        ];
    }


    public function setTheme()
    {
        if (!isset($_GET["theme"])) {
            return;
        }

        $this->uMod->setUserTheme($_GET["theme"]);
    }


    protected function buildCSS()
    {
        if (is_null($this->css)) {
            return;
        }

        $this->cssArr = array_merge(
            (array)$this->css->clear,
            (array)$this->css->libs,
            (array)$this->css->app,
            (array)$this->css->page
        );

        $this->userTheme = $this->uMod->getUserTheme();
        $this->themes = getThemes("view/css/");
        $this->themeStylesheet = $this->themes[$this->userTheme];
    }


    // Check user status required for page access
    public function checkUser($loggedIn = true, $adminOnly = false)
    {
        $this->uMod = UserModel::getInstance();
        // Check session and cookies
        $this->user_id = $this->uMod->check();

        // Get name of user person
        if ($this->user_id) {
            $this->owner_id = $this->uMod->getOwner();

            $this->personMod = PersonModel::getInstance();
            $personObj = $this->personMod->getItem($this->owner_id);
            if ($personObj) {
                $this->user_name = $personObj->name;
            }
        } else {
            $this->owner_id = 0;
        }

        if ($loggedIn) {      // user should be logged in to access
            if (!$this->user_id) {
                setLocation(BASEURL . "login/");
            } elseif ($adminOnly && !$this->uMod->isAdmin($this->user_id)) {
                setLocation(BASEURL);
            }
        } else // user should be logged out ot access
        {
            if ($this->user_id != 0) {
                setLocation(BASEURL);
            }
        }

        $this->onStart();
    }
}
