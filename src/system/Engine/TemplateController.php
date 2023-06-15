<?php

namespace JezveMoney\Core;

use JezveMoney\Core\Controller;
use JezveMoney\App\Model\UserModel;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Model\UserSettingsModel;

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

    protected function initResources(string $viewName)
    {
        $manifest = JSON::fromFile(VIEW_PATH . "manifest.json", true);
        if (!isset($manifest[$viewName])) {
            throw new \Error("Invalid view name");
        }

        $viewResources = $manifest[$viewName];
        foreach ($viewResources as $resource) {
            if (str_ends_with($resource, ".js")) {
                if (str_starts_with($resource, JS_PATH)) {
                    $resource = substr($resource, strlen(JS_PATH));
                    $this->jsArr[] = $resource;
                }
            } elseif (str_ends_with($resource, ".css")) {
                if (str_starts_with($resource, CSS_PATH)) {
                    $resource = substr($resource, strlen(CSS_PATH));
                    $this->cssArr[] = $resource;
                }
            } else {
                throw new \Error("Invalid type of resource");
            }
        }
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
        $themes = getThemes();
        $this->template->themes = $themes;
        $this->template->themeColor = $themes[$userTheme]["color"];
        $this->template->themeClass = $themes[$userTheme]["className"];
    }

    /**
     * Returns URL to load after successfull submit or cancel
     *
     * @return string
     */
    protected function getNextAddress()
    {
        $referer = $_SERVER["HTTP_REFERER"] ?? null;
        return (!is_null($referer) && strpos($referer, BASEURL) === 0) ? $referer : BASEURL;
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
     * @param bool|null $loggedIn logged in flag, if null - available regardless of status
     * @param bool $adminOnly admin access flag
     */
    public function checkUser(?bool $loggedIn = true, bool $adminOnly = false)
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

        if ($loggedIn === true) {      // user should be logged in to access
            if (!$this->user_id) {
                setLocation(BASEURL . "login/");
            } elseif ($adminOnly && !$this->uMod->isAdmin($this->user_id)) {
                setLocation(BASEURL);
            }
        } elseif ($loggedIn === false) { // user should be logged out ot access
            if ($this->user_id != 0) {
                setLocation(BASEURL);
            }
        }

        $this->onStart();
    }

    /**
     * Returns profile data for view
     *
     * @return array|null
     */
    public function getProfileData()
    {
        if (!$this->user_id) {
            return null;
        }

        return [
            "user_id" => $this->user_id,
            "owner_id" => $this->owner_id,
            "name" => $this->user_name,
            "settings" => $this->getSettings(),
        ];
    }

    /**
     * Returns user settings
     *
     * @return array
     */
    public function getSettings()
    {
        $settingsModel = UserSettingsModel::getInstance();
        $settings = $settingsModel->getSettings();
        return $settings->getUserData();
    }
}
