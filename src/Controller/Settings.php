<?php

namespace JezveMoney\App\Controller;

use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\UserCurrencyModel;
use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

/**
 * Settings controller
 */
class Settings extends TemplateController
{
    /**
     * /settings/ route handler
     * Renders settings view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "Settings.tpl");
        $data = [];

        $profileInfo = $this->getProfileData();

        $titleString = __("appName") . " | " . __("settings.title");
        $data["titleString"] = $titleString;

        $currModel = CurrencyModel::getInstance();
        $userCurrModel = UserCurrencyModel::getInstance();

        $viewProps = [];

        $data["appProps"] = [
            "profile" => $profileInfo,
            "currency" => $currModel->getData(),
            "userCurrencies" => $userCurrModel->getData(),
            "view" => $viewProps,
        ];

        $this->initResources("SettingsView");
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

        setLocation(BASEURL . "settings/");
    }
}
