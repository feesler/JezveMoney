<?php

namespace JezveMoney\App\Controller;

use JezveMoney\App\Model\CategoryModel;
use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

class Categories extends TemplateController
{
    protected $requiredFields = ["name", "parent_id", "type"];

    protected function onStart()
    {
        $this->model = CategoryModel::getInstance();
    }

    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "CategoryList.tpl");
        $data = [
            "titleString" => "Jezve Money | Categories",
        ];
        $data["appProps"] = [
            "categories" => $this->model->getData()
        ];

        $this->cssArr[] = "CategoryListView.css";
        $this->jsArr[] = "CategoryListView.js";

        $this->render($data);
    }


    protected function fail($msg = null)
    {
        if (!is_null($msg)) {
            Message::set($msg);
        }

        setLocation(BASEURL . "categories/");
    }


    public function create()
    {
        if ($this->isPOST()) {
            $this->fail(ERR_INVALID_REQUEST);
        }

        $this->template = new Template(VIEW_TPL_PATH . "Category.tpl");
        $data = [
            "headString" => "New category",
            "titleString" => "Jezve Money | New category"
        ];

        $categories = $this->model->getData();

        $category = new \stdClass();
        $category->id = 0;
        $category->name = "";
        $category->parent_id = 0;
        $category->type = 0;

        $data["category"] = $category;

        $data["appProps"] = [
            "categories" => $categories,
            "view" => [
                "category" => $category
            ]
        ];

        $this->cssArr[] = "CategoryView.css";
        $this->jsArr[] = "CategoryView.js";

        $this->render($data);
    }


    public function update()
    {
        if ($this->isPOST()) {
            $this->fail(ERR_INVALID_REQUEST);
        }

        $this->template = new Template(VIEW_TPL_PATH . "Category.tpl");
        $data = [
            "headString" => "Edit category",
            "titleString" => "Jezve Money | Edit category"
        ];

        $itemId = intval($this->actionParam);
        if (!$itemId) {
            $this->fail(ERR_CATEGORY_UPDATE);
        }

        $category = $this->model->getItem($itemId);
        if (!$category) {
            $this->fail(ERR_CATEGORY_UPDATE);
        }
        $data["category"] = $category;

        $categories = $this->model->getData();

        $data["appProps"] = [
            "categories" => $categories,
            "view" => [
                "category" => $category,
            ],
        ];

        $this->cssArr[] = "CategoryView.css";
        $this->jsArr[] = "CategoryView.js";

        $this->render($data);
    }
}
