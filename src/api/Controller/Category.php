<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\CategoryModel;

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
     * Removes categories
     */
    public function del()
    {
        $request = $this->getRequestData();
        $this->model->removeChild = $request["removeChild"] ?? true;

        parent::del();
    }
}
