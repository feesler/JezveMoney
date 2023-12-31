<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\ImportConditionModel;

/**
 * Import conditions API controller
 */
class ImportCondition extends ApiListController
{
    protected $model = null;
    protected $requiredFields = [
        "rule_id",
        "field_id",
        "operator",
        "value",
        "flags"
    ];
    protected $defaultValues = [
        "flags" => 0,
    ];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = ImportConditionModel::getInstance();
        $this->createErrorMsg = __("import.conditions.errors.create");
        $this->updateErrorMsg = __("import.conditions.errors.update");
        $this->deleteErrorMsg = __("import.conditions.errors.delete");
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
