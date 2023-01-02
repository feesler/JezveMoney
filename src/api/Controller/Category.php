<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Item\CategoryItem;

class Category extends ApiListController
{
    protected $requiredFields = ["name", "parent_id", "type"];

    public function initAPI()
    {
        parent::initAPI();

        $this->model = CategoryModel::getInstance();
        $this->createErrorMsg = __("ERR_CATEGORY_CREATE");
        $this->updateErrorMsg = __("ERR_CATEGORY_UPDATE");
        $this->deleteErrorMsg = __("ERR_CATEGORY_DELETE");
    }


    protected function prepareItem($item)
    {
        return new CategoryItem($item);
    }
}
