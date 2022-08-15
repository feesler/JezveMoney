<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;

class User extends AdminController
{
    public function index()
    {
        $this->template = new Template(ADMIN_TPL_PATH . "user.tpl");
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
            "view" => [
                "data" => $itemsData,
            ],
        ];

        $this->cssAdmin[] = "AdminUserView.css";
        $this->jsAdmin[] = "AdminUserView.js";

        $this->render($data);
    }
}
