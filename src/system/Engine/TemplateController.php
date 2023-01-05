<?php

namespace JezveMoney\Core;

use JezveMoney\Core\Controller;
use JezveMoney\App\Model\UserModel;
use JezveMoney\App\Model\PersonModel;

/**
 * Base template controller
 */
abstract class TemplateController extends Controller
{
    public $action = null;
    public $actionParam = null;
    protected $template = null;
    protected $cssArr = null;
    protected $css = null;
    protected $jsArr = null;
    protected $uMod = null;
    protected $adminUser = null;
    protected $personMod = null;
    protected $user_name = null;
    protected $user_id = 0;
    protected $owner_id = 0;
    protected $themesPath = "view/css/themes/";
    protected $locale = null;
    protected $locales = [];


    abstract public function index();

    /**
     * Initialize application resources
     */
    public function initDefResources()
    {
        $this->cssArr = [];

        $this->setupLocales();

        $this->jsArr = [
            "polyfill/index.js",
            "locale/" . $this->locale . ".js",
        ];
    }

    /**
     * Loads locales
     */
    protected function setupLocales()
    {
        $this->locale = Locale::getUserLocale();
        $this->locales = Locale::getAvailable();
    }

    /**
     * Loads themes data
     */
    protected function setupThemes()
    {
        $userTheme = $this->uMod->getUserTheme();
        $this->template->userTheme = $userTheme;
        $themes = getThemes($this->themesPath);
        $this->template->themes = $themes;
        $this->template->themeStylesheet = $themes[$userTheme]["file"];
        $this->template->themeClass = $themes[$userTheme]["className"];
    }

    /**
     * Renders template with specified data
     *
     * @param array $data
     */
    protected function render(array $data = [])
    {
        $this->template->action = $this->action;
        $this->template->actionParam = $this->actionParam;

        $this->template->cssArr = $this->cssArr;
        $this->template->jsArr = $this->jsArr;
        $this->template->user_id = $this->user_id;
        $this->template->user_name = $this->user_name;
        $this->template->adminUser = $this->adminUser;
        $this->template->locale = $this->locale;

        $this->setupThemes();

        if (!isset($data["appProps"])) {
            $data["appProps"] = [];
        }
        $data["appProps"]["baseURL"] = BASEURL;
        $data["appProps"]["themesPath"] = $this->themesPath;
        $data["appProps"]["themes"] = (object)$this->template->themes;
        $data["appProps"]["locales"] = $this->locales;
        $data["appProps"]["locale"] = $this->locale;

        // Check message
        $message = Message::check();
        if (!is_null($message)) {
            $data["appProps"]["message"] = $message;
        }

        $data["appProps"] = JSON::encode($data["appProps"]);

        echo $this->template->render($data);
    }

    /**
     * Checks user status required for page access
     *
     * @param bool $loggedIn logged in flag
     * @param bool $adminOnly admin access flag
     */
    public function checkUser(bool $loggedIn = true, bool $adminOnly = false)
    {
        $this->uMod = UserModel::getInstance();
        // Check session and cookies
        $this->user_id = $this->uMod->check();
        $this->adminUser = $this->uMod->isAdmin($this->user_id);

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
        } else { // user should be logged out ot access
            if ($this->user_id != 0) {
                setLocation(BASEURL);
            }
        }

        $this->onStart();
    }

    /**
     * Returns profile data for view
     *
     * @return array
     */
    public function getProfileData()
    {
        return [
            "user_id" => $this->user_id,
            "owner_id" => $this->owner_id,
            "name" => $this->user_name,
        ];
    }
}
