<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;

class User extends AdminController
{
    public function index()
    {
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
        $viewData = [
            "data" => $itemsData
        ];

        $this->menuItems["users"]["active"] = true;

        $titleString = "Admin panel | Users";

        $this->cssAdmin[] = "AdminUserView.css";
        $this->buildCSS();
        $this->jsAdmin[] = "AdminUserView.js";

        include(ADMIN_TPL_PATH . "user.tpl");
    }
}
