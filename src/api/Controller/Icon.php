<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\IconModel;

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
        $this->createErrorMsg = __("icons.errors.create");
        $this->updateErrorMsg = __("icons.errors.update");
        $this->deleteErrorMsg = __("icons.errors.delete");
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
