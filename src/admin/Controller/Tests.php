<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\Core\ApiResponse;

class Tests extends AdminController
{
    public function index()
    {
        $titleString = "Admin panel | Tests";

        $this->menuItems["tests"]["active"] = true;

        $currMod = CurrencyModel::getInstance();
        $currArr = $currMod->getData();

        $iconMod = IconModel::getInstance();
        $icons = $iconMod->getData();

        $this->cssAdmin[] = "tests.css";
        $this->buildCSS();

        $this->jsArr = [
            "lib/common.js",
            "lib/ajax.js",
            "lib/popup.js",
            "app.js"
        ];
        $this->jsAdmin[] = "tests/index.js";

        include(ADMIN_TPL_PATH . "tests.tpl");
    }


    public function upload()
    {
        $res = new ApiResponse();

        try {
            if (!$this->isPOST()) {
                throw new \Error("Invalid request");
            }

            $data = file_get_contents('php://input');

            $tmpName = tempnam(UPLOAD_PATH, "test_");
            if ($tmpName === false) {
                throw new \Error("Failed to create file");
            }

            $filePath = $tmpName . ".csv";
            $result = rename($tmpName, $filePath);
            if ($result === false) {
                throw new \Error("Failed to write file");
            }

            $result = file_put_contents($filePath, $data);
            if ($result === false) {
                throw new \Error("Failed to write file");
            }

            $res->data = new \stdClass();
            $res->data->filename = basename($filePath);
        } catch (\Error $e) {
            $res->fail($e->getMessage());
        }

        $res->ok();
    }

    public function remove()
    {
        $res = new ApiResponse();

        try {
            if (!$this->isPOST()) {
                throw new \Error("Invalid request");
            }

            $reqData = $this->getJSONContent(true);
            if (!$reqData || !isset($reqData["filename"])) {
                throw new \Error("File name not specified");
            }

            $filePath = UPLOAD_PATH . $reqData["filename"];
            if (file_exists($filePath)) {
                if (unlink($filePath) === false) {
                    throw new \Error("Fail to remove file");
                }
            }
        } catch (\Error $e) {
            $res->fail($e->getMessage());
        }

        $res->ok();
    }
}
