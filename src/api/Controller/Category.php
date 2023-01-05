<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Item\CategoryItem;

/**
 * Categories API controller
 */
class Category extends ApiListController
{
    protected $requiredFields = ["name", "parent_id", "type"];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = CategoryModel::getInstance();
        $this->createErrorMsg = __("ERR_CATEGORY_CREATE");
        $this->updateErrorMsg = __("ERR_CATEGORY_UPDATE");
        $this->deleteErrorMsg = __("ERR_CATEGORY_DELETE");
    }

    /**
     * Returns item object prepared for API response
     *
     * @param object $item
     *
     * @return object
     */
    protected function prepareItem(object $item)
    {
        return new CategoryItem($item);
    }
}
