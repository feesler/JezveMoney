<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\ImportActionModel;

/**
 * Import actions API controller
 */
class ImportAction extends ApiListController
{
    protected $requiredFields = [
        "rule_id",
        "action_id",
        "value",
    ];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = ImportActionModel::getInstance();
        $this->createErrorMsg = __("import.actions.errors.create");
        $this->updateErrorMsg = __("import.actions.errors.update");
        $this->deleteErrorMsg = __("import.actions.errors.delete");
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
        $res = [];
        if (isset($request["full"]) && $request["full"] == true) {
            $res["full"] = true;
        }
        if (isset($request["rule"])) {
            $res["rule"] = $request["rule"];
        }

        return $res;
    }

    /**
     * Returns array of items for specified request
     *
     * @param array $request
     *
     * @return array
     */
    protected function getListItems(array $request = [])
    {
        return $this->model->getData($request);
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
