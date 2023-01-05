<?php

namespace JezveMoney\App\Controller;

use JezveMoney\App\Model\CategoryModel;
use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

/**
 * Categories controller
 */
class Categories extends TemplateController
{
    protected $requiredFields = ["name", "parent_id", "type"];
    protected $model = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = CategoryModel::getInstance();
    }

    /**
     * /categories/ route handler
     * Renders categories list view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "CategoryList.tpl");
        $data = [
            "titleString" => __("APP_NAME") . " | " . __("CATEGORIES"),
        ];
        $data["appProps"] = [
            "categories" => $this->model->getData()
        ];

        $this->cssArr[] = "CategoryListView.css";
        $this->jsArr[] = "CategoryListView.js";

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

        setLocation(BASEURL . "categories/");
    }

    /**
     * /categories/create/ route handler
     * Renders create category view
     */
    public function create()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Category.tpl");
        $data = [
            "headString" => __("CATEGORY_CREATE"),
            "titleString" => __("APP_NAME") . " | " . __("CATEGORY_CREATE"),
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

    /**
     * /categories/update/ route handler
     * Renders update category view
     */
    public function update()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Category.tpl");
        $data = [
            "headString" => __("CATEGORY_UPDATE"),
            "titleString" => __("APP_NAME") . " | " . __("CATEGORY_UPDATE"),
        ];

        $itemId = intval($this->actionParam);
        if (!$itemId) {
            $this->fail(__("ERR_CATEGORY_UPDATE"));
        }

        $category = $this->model->getItem($itemId);
        if (!$category) {
            $this->fail(__("ERR_CATEGORY_UPDATE"));
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
