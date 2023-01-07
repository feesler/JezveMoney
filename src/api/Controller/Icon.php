<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Item\IconItem;

/**
 * Icons API controller
 */
class Icon extends ApiListController
{
    protected $requiredFields = ["name", "file", "type"];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = IconModel::getInstance();
        $this->createErrorMsg = __("ERR_ICON_CREATE");
        $this->updateErrorMsg = __("ERR_ICON_UPDATE");
        $this->deleteErrorMsg = __("ERR_ICON_DELETE");
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
     * Creates multiple items
     */
    public function createMultiple()
    {
        $this->checkAdminAccess();
        parent::createMultiple();
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
