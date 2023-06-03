<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Settings;

/**
 * System settings API controller
 */
class SystemSettings extends ApiController
{
    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        if (!$this->user_id) {
            throw new \Error("User not found");
        }
    }

    /**
     * Reads system settings
     */
    public function index()
    {
        $this->checkAdminAccess();

        $this->ok([
            "settings" => Settings::getData(),
        ]);
    }

    /**
     * Updates setting value
     */
    public function update()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $expectedFields = ["name", "value"];
        $request = $this->getRequestData();
        checkFields($request, $expectedFields, true);

        $res = Settings::setValue($request["name"], $request["value"]);
        if (!$res) {
            throw new \Error(__("ERR_SETTINGS_UPDATE"));
        }

        $this->ok();
    }

    /**
     * Removes setting
     */
    public function del()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $expectedFields = ["name"];
        $request = $this->getRequestData();
        checkFields($request, $expectedFields, true);

        $res = Settings::del($request["name"]);
        if (!$res) {
            throw new \Error(__("ERR_SETTINGS_UPDATE"));
        }

        $this->ok();
    }
}
