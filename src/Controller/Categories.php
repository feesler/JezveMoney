<?php

namespace JezveMoney\App\Controller;

use JezveMoney\App\Model\CategoryModel;
use JezveMoney\Core\ListViewController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

/**
 * Categories controller
 */
class Categories extends ListViewController
{
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
            "titleString" => __("appName") . " | " . __("categories.listTitle"),
        ];
        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "categories" => $this->model->getData(),
            "view" => [
                "detailsId" => $this->getRequestedItem(),
            ],
        ];

        $this->initResources("CategoryListView");
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
            $this->fail(__("errors.invalidRequest"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Category.tpl");
        $data = [
            "headString" => __("categories.create"),
            "titleString" => __("appName") . " | " . __("categories.create"),
        ];

        $category = new \stdClass();
        $category->id = 0;
        $category->name = "";
        $category->parent_id = 0;
        $category->type = 0;

        $data["category"] = $category;

        $data["nextAddress"] = $this->getNextAddress();
        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "categories" => $this->model->getData(),
            "view" => [
                "category" => $category,
            ]
        ];

        $this->initResources("CategoryView");
        $this->render($data);
    }

    /**
     * /categories/update/ route handler
     * Renders update category view
     */
    public function update()
    {
        if ($this->isPOST()) {
            $this->fail(__("errors.invalidRequest"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "Category.tpl");
        $data = [
            "headString" => __("categories.update"),
            "titleString" => __("appName") . " | " . __("categories.update"),
        ];

        $itemId = intval($this->actionParam);
        if (!$itemId) {
            $this->fail(__("categories.errors.update"));
        }

        $category = $this->model->getItem($itemId);
        if (!$category) {
            $this->fail(__("categories.errors.update"));
        }
        $data["category"] = $category;

        $data["nextAddress"] = $this->getNextAddress();
        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "categories" => $this->model->getData(),
            "view" => [
                "category" => $category,
            ],
        ];

        $this->initResources("CategoryView");
        $this->render($data);
    }
}
