<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;

class User extends AdminController
{
    public function index()
    {
        $uArr = $this->uMod->getData(["all" => true]);

        $accessLevels = [
            "0" => "Default",
            "1" => "Admin",
            "2" => "Tester",
        ];
        foreach ($uArr as $userInfo) {
            if (isset($accessLevels[$userInfo->access])) {
                $userInfo->accessTitle = $accessLevels[$userInfo->access];
            } else {
                $userInfo->accessTitle = "Unknown access level: " . $userInfo->access;
            }
        }

        $this->menuItems["users"]["active"] = true;

        $titleString = "Admin panel | Users";

        $this->buildCSS();

        array_push(
            $this->jsArr,
            "lib/component.js",
            "component/confirmdialog.js",
            "view.js"
        );
        array_push(
            $this->jsAdmin,
            "adminview.js",
            "adminlistview.js",
            "userview.js",
        );

        include(ADMIN_TPL_PATH . "user.tpl");
    }
}
