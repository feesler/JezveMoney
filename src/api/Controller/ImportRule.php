<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportConditionModel;
use JezveMoney\App\Model\ImportActionModel;

/**
 * Import rules API controller
 */
class ImportRule extends ApiListController
{
    protected $requiredFields = [
        "flags",
        "conditions",
        "actions"
    ];

    protected $condModel = null;
    protected $actionModel = null;

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = ImportRuleModel::getInstance();
        $this->condModel = ImportConditionModel::getInstance();
        $this->actionModel = ImportActionModel::getInstance();
        $this->createErrorMsg = __("ERR_IMPORT_RULE_CREATE");
        $this->updateErrorMsg = __("ERR_IMPORT_RULE_UPDATE");
        $this->deleteErrorMsg = __("ERR_IMPORT_RULE_DELETE");
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
        if (isset($request["extended"]) && $request["extended"] == true) {
            $res["extended"] = true;
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
     * Returns request verification result
     *
     * @param array $request
     *
     * @return bool
     */
    protected function verifyRequest(array $request)
    {
        if (
            !is_array($request)
            || !isset($request["conditions"])
            || !is_array($request["conditions"])
            || !count($request["conditions"])
            || !isset($request["actions"])
            || !is_array($request["actions"])
            || !count($request["actions"])
        ) {
            return false;
        }

        foreach ($request["conditions"] as $condition) {
            if (!is_array($condition)) {
                return false;
            }
        }

        foreach ($request["actions"] as $action) {
            if (!is_array($action)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Sets conditions and actions for specified rule
     *
     * @param int $ruleId import rule id
     * @param array $data condition and action lists
     *
     * @return bool
     */
    private function setRuleData(int $ruleId, array $data)
    {
        if (!is_array($data)) {
            return false;
        }

        if (isset($data["conditions"])) {
            $res = $this->condModel->setRuleConditions($ruleId, $data["conditions"]);
            if (!$res) {
                return false;
            }
        }

        if (isset($data["actions"])) {
            $res = $this->actionModel->setRuleActions($ruleId, $data["actions"]);
            if (!$res) {
                return false;
            }
        }

        return true;
    }

    /**
     * Performs controller-specific preparation of create request data
     *
     * @param array $request
     *
     * @return array
     */
    protected function preCreate(array $request)
    {
        if (!$this->verifyRequest($request)) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        return $request;
    }

    /**
     * Performs controller-specific actions after new item successfully created
     *
     * @param int|int[]|null $item_id id or array of created item ids
     * @param array $request create request data
     */
    protected function postCreate(mixed $item_id, array $request)
    {
        if (!$this->setRuleData($item_id, $request)) {
            $this->model->del($item_id);
            throw new \Error($this->createErrorMsg);
        }
    }

    /**
     * Performs controller-specific preparation of update request data
     *
     * @param array $request update request data
     *
     * @return array
     */
    protected function preUpdate(array $request)
    {
        return $this->preCreate($request);
    }

    /**
     * Performs controller-specific actions after update successfully completed
     *
     * @param array $request update request data
     */
    protected function postUpdate(array $request)
    {
        if (!$this->setRuleData($request["id"], $request)) {
            throw new \Error($this->updateErrorMsg);
        }
    }
}
