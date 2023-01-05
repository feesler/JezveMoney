<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\ImportActionModel;
use JezveMoney\App\Item\ImportActionItem;

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
        $this->createErrorMsg = __("ERR_IMPORT_ACT_CREATE");
        $this->updateErrorMsg = __("ERR_IMPORT_ACT_UPDATE");
        $this->deleteErrorMsg = __("ERR_IMPORT_ACT_DELETE");
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
        return new ImportActionItem($item);
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
