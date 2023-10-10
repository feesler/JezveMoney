<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\ColorModel;

/**
 * Colors API controller
 */
class Color extends ApiListController
{
    protected $requiredFields = ["value", "type"];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = ColorModel::getInstance();
        $this->createErrorMsg = __("colors.errors.create");
        $this->updateErrorMsg = __("colors.errors.update");
        $this->deleteErrorMsg = __("colors.errors.delete");
    }

    /**
     * Returns list request prepared for controller-specific model
     *
     * @param array $request
     *
     * @return array
     */
    protected function prepareListRequest(array $request)
    {
        return [];
    }

    /**
     * Creates new item
     */
    public function create()
    {
        $this->checkAdminAccess();
        parent::create();
    }

    /**
     * Updates item
     */
    public function update()
    {
        $this->checkAdminAccess();
        parent::update();
    }

    /**
     * Removes item(s)
     */
    public function del()
    {
        $this->checkAdminAccess();
        parent::del();
    }
}
