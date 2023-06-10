<?php

namespace JezveMoney\Core;

use JezveMoney\App\API\Controller\State;

/**
 * Base API list controller
 */
class ApiListController extends ApiController
{
    protected $requiredFields = [];
    protected $defaultValues = [];
    protected $model = null;
    protected $createErrorMsg = null;
    protected $updateErrorMsg = null;
    protected $deleteErrorMsg = null;

    /**
     * Returns item object prepared for API response
     *
     * @param object $item item object from model
     * @param bool $isList list item flag. Default is false
     *
     * @return object
     */
    protected function prepareItem(object $item, bool $isList = false)
    {
        return $item;
    }

    /**
     * Read items by ids
     */
    public function index()
    {
        $ids = $this->getRequestedIds();
        if (!is_array($ids) || !count($ids)) {
            throw new \Error(__("ERR_NO_IDS"));
        }

        $res = [];
        foreach ($ids as $item_id) {
            $item = $this->model->getItem($item_id);
            if (is_null($item)) {
                throw new \Error("Item $item_id not found");
            }

            $res[] = $this->prepareItem($item);
        }

        $this->ok($res);
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
        return $request;
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
        $items = $this->model->getData($request);
        $res = [];
        foreach ($items as $item) {
            $res[] = $this->prepareItem($item, true);
        }
        return $res;
    }

    /**
     * Read items list
     */
    public function getList()
    {
        $data = $this->getRequestData();
        $request = $this->prepareListRequest($data);
        $items = $this->getListItems($request);

        $this->ok($items);
    }

    /**
     * Returns array of mandatory fields
     *
     * @param array $item
     *
     * @return array
     */
    protected function getExpectedFields(array $item)
    {
        return $this->requiredFields;
    }

    /**
     * Returns array of default field values
     *
     * @param array $item
     *
     * @return array
     */
    protected function getDefaultValues(array $item)
    {
        return $this->defaultValues;
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
        return $request;
    }

    /**
     * Obtains state request from specified API request data and returns result
     *
     * @param array $request API request data
     *
     * @return array|null
     */
    protected function getStateRequest(array $request)
    {
        $stateRequest = $request["returnState"] ?? null;
        if (is_null($stateRequest)) {
            return null;
        }

        return (is_string($stateRequest))
            ? JSON::decode($stateRequest, true)
            : $stateRequest;
    }

    /**
     * Returns state for specified request
     *
     * @param array $request API request data
     *
     * @return array|null
     */
    protected function getState(array $request)
    {
        $stateRequest = $this->getStateRequest($request);
        if (is_null($stateRequest)) {
            return null;
        }

        $stateController = new State();
        return $stateController->getData($stateRequest);
    }

    /**
     * Performs state result for specified request
     *
     * @param array $request request data
     *
     * @return array|null
     */
    protected function getStateResult(array $request)
    {
        $state = $this->getState($request);
        return (is_null($state)) ? null : ["state" => $state];
    }

    /**
     * Performs controller-specific actions after new item successfully created
     *
     * @param int|int[]|null $item_id id or array of created item ids
     * @param array $request create request data
     *
     * @return mixed
     */
    protected function postCreate(mixed $item_id, array $request)
    {
        $result = [];
        if (is_array($item_id)) {
            $result["ids"] = $item_id;
        } else {
            $result["id"] = $item_id;
        }

        $state = $this->getState($request);
        if (!is_null($state)) {
            $result["state"] = $state;
        }

        return $result;
    }

    /**
     * Creates new item
     */
    public function create()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $request = $this->getRequestData();
        $requestData = asArray($request["data"] ?? [$request]);
        if (!is_array($requestData) || count($requestData) === 0) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        $this->begin();

        $items = [];
        foreach ($requestData as $item) {
            if (!is_array($item)) {
                throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
            }

            $expectedFields = $this->getExpectedFields($item);
            $default = $this->getDefaultValues($item);
            $itemData = array_merge($default, $item);
            checkFields($itemData, $expectedFields, true);

            $items[] = $this->preCreate($itemData);
        }

        $ids = null;
        try {
            $ids = (count($items) > 1)
                ? $this->model->createMultiple($items)
                : $this->model->create($items[0]);
        } catch (\Error $e) {
            wlog("Create item error: " . $e->getMessage());
        }
        if (!$ids) {
            throw new \Error($this->createErrorMsg);
        }

        $result = $this->postCreate($ids, $request);

        $this->commit();

        $this->ok($result);
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
        return $request;
    }

    /**
     * Performs controller-specific actions after update successfully completed
     *
     * @param array $request update request data
     */
    protected function postUpdate(array $request)
    {
        $state = $this->getState($request);
        return (is_null($state)) ? null : ["state" => $state];
    }

    /**
     * Updates item
     */
    public function update()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $request = $this->getRequestData();
        if (!$request || !isset($request["id"])) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        $expectedFields = $this->getExpectedFields($request);
        $reqData = copyFields($request, $expectedFields);
        if ($reqData === false) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        $this->begin();

        $itemData = $this->preUpdate($request);

        $updateResult = false;
        try {
            $updateResult = $this->model->update($request["id"], $itemData);
        } catch (\Error $e) {
            wlog("Update item error: " . $e->getMessage());
        }
        if (!$updateResult) {
            throw new \Error($this->updateErrorMsg);
        }

        $result = $this->postUpdate($request);

        $this->commit();

        $this->ok($result);
    }

    /**
     * Performs controller-specific actions after items successfully removed
     *
     * @param array $request request data
     */
    protected function postDelete(array $request)
    {
        $state = $this->getState($request);
        return (is_null($state)) ? null : ["state" => $state];
    }

    /**
     * Removes item(s)
     */
    public function del()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (!is_array($ids) || !count($ids)) {
            throw new \Error(__("ERR_NO_IDS"));
        }

        $this->begin();

        $deleteResult = false;
        try {
            $deleteResult = $this->model->del($ids);
        } catch (\Error $e) {
            wlog("Delete item(s) error: " . $e->getMessage());
        }
        if (!$deleteResult) {
            throw new \Error($this->deleteErrorMsg);
        }

        $request = $this->getRequestData();
        $result = $this->postDelete($request);

        $this->commit();

        $this->ok($result);
    }
}
