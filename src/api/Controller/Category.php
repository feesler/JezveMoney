<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiSortableListController;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\TransactionModel;

/**
 * Categories API controller
 */
class Category extends ApiSortableListController
{
    protected $transModel = null;
    protected $requiredFields = ["name", "color", "parent_id", "type"];
    protected $changePosFields = ["id", "pos", "parent_id"];
    protected $defaultValues = [
        "parent_id" => 0,
    ];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = CategoryModel::getInstance();
        $this->transModel = TransactionModel::getInstance();
        $this->createErrorMsg = __("categories.errors.create");
        $this->updateErrorMsg = __("categories.errors.update");
        $this->deleteErrorMsg = __("categories.errors.delete");
        $this->changePosErrorMsg = __("categories.errors.changePos");
    }

    /**
     * Returns item object prepared for API response
     *
     * @param object $item item object from model
     * @param bool $isList list item flag. Default is false
     *
     * @return object
     */
    protected function prepareItem(object $item, bool $isList = false)
    {
        if ($isList) {
            return $item;
        }

        $res = $item;
        $res->transactionsCount = $this->transModel->getTransCount([
            "categories" => $item->id,
        ]);

        return $res;
    }

    /**
     * Removes categories
     */
    public function del()
    {
        $request = $this->getRequestData();
        $this->model->removeChild = $request["removeChild"] ?? true;

        parent::del();
    }
}
