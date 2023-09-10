<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;

/**
 * Users admin controller
 */
class User extends AdminController
{
    /**
     * /admin/user/ route handler
     * Renders users admin view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "User.tpl");
        $data = [
            "titleString" => "Admin panel | Users",
        ];

        $itemsData = $this->uMod->getData(["all" => true]);

        $accessLevels = [
            "0" => "Default",
            "1" => "Admin",
            "2" => "Tester",
        ];
        foreach ($itemsData as $userInfo) {
            if (isset($accessLevels[$userInfo->access])) {
                $userInfo->accessTitle = $accessLevels[$userInfo->access];
            } else {
                $userInfo->accessTitle = "Unknown access level: " . $userInfo->access;
            }
        }
        $data["itemsData"] = $itemsData;
        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "view" => [
                "data" => $itemsData,
            ],
        ];

        $this->initResources("AdminUserView");
        $this->render($data);
    }
}
