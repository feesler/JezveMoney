<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\Core\ApiResponse;

/**
 * Tests controller
 */
class Tests extends AdminController
{
    /**
     * /admin/tests/ route handler
     * Renders browser tests view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "Tests.tpl");
        $data = [
            "titleString" => "Admin panel | Tests",
        ];

        $this->cssAdmin[] = "AdminTestsView.css";
        $this->jsAdmin[] = "AdminTestsView.js";
        $this->jsAdmin[] = "tests/index.js";

        $this->render($data);
    }

    /**
     * /admin/tests/upload/ route handler
     * Creates import file in the upload directory
     */
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

            $respData = new \stdClass();
            $respData->filename = basename($filePath);

            $res->setData($respData);
            $res->ok();
        } catch (\Error $e) {
            $res->fail($e->getMessage());
        }
    }

    /**
     * /admin/tests/remove/ route handler
     * Removes previously uploaded files
     */
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

            $res->ok();
        } catch (\Error $e) {
            $res->fail($e->getMessage());
        }
    }
}
