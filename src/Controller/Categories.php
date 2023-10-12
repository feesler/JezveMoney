<?php

namespace JezveMoney\App\Controller;

use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\TransactionModel;
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

        $trType = $this->getRequestedType($_GET, EXPENSE);

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "categories" => $this->model->getData(),
            "view" => [
                "detailsId" => $this->getRequestedItem(),
                "selectedType" => $trType,
            ],
        ];

        $this->initResources("CategoryListView");
        $this->render($data);
    }

    /**
     * Returns transaction type from request
     *
     * @param array $request request data
     * @param int $default default transaction type
     *
     * @return int
     */
    protected function getRequestedType(array $request, int $default)
    {
        if (!is_array($request) || !isset($request["type"])) {
            return $default;
        }
        $res = intval($request["type"]);
        if (!$res) {
            if (strtolower($request["type"]) === "any") {
                return 0;
            }
            $res = TransactionModel::stringToType($request["type"]);
        }
        if (!$res) {
            $this->fail(__("transactions.errors.invalidType"));
        }

        return $res;
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

        $parent_id = isset($_GET["parent_id"]) ? intval($_GET["parent_id"]) : 0;
        $parentCategory = $this->model->getItem($parent_id);
        if (!$parentCategory) {
            $parent_id = 0;
        }

        $type = isset($_GET["type"])
            ? intval($_GET["type"])
            : ($parentCategory->type ?? 0);

        $color = ($parentCategory)
            ? $parentCategory->color
            : $this->model->getNextColor();

        $category = new \stdClass();
        $category->id = 0;
        $category->name = "";
        $category->color = $color;
        $category->parent_id = $parent_id;
        $category->type = $type;

        $data["category"] = $category;

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "categories" => $this->model->getData(),
            "nextAddress" => $this->getNextAddress(),
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

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "categories" => $this->model->getData(),
            "nextAddress" => $this->getNextAddress(),
            "view" => [
                "category" => $category,
            ],
        ];

        $this->initResources("CategoryView");
        $this->render($data);
    }
}
