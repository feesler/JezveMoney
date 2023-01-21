<?php

namespace JezveMoney\Core;

/**
 * Base API list controller
 */
class ApiListController extends ApiController
{
    protected $requiredFields = [];
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
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
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
     * @param array $request
     *
     * @return array
     */
    protected function getExpectedFields(array $request)
    {
        return $this->requiredFields;
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
     * Performs controller-specific actions after new item successfully created
     *
     * @param int|int[]|null $item_id id or array of created item ids
     * @param array $request create request data
     */
    protected function postCreate(mixed $item_id, array $request)
    {
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
        if (!$request) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        $expectedFields = $this->getExpectedFields($request);
        $checkResult = checkFields($request, $expectedFields);
        if ($checkResult === false) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        $this->begin();

        $itemData = $this->preCreate($request);

        $item_id = null;
        try {
            $item_id = $this->model->create($itemData);
        } catch (\Error $e) {
            wlog("Create item error: " . $e->getMessage());
        }
        if (!$item_id) {
            throw new \Error($this->createErrorMsg);
        }

        $this->postCreate($item_id, $request);

        $this->commit();

        $this->ok(["id" => $item_id]);
    }

    /**
     * Creates multiple items
     */
    public function createMultiple()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $request = $this->getRequestData();
        if (!is_array($request)) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        $this->begin();

        $items = [];
        foreach ($request as $item) {
            if (!is_array($item)) {
                throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
            }

            $expectedFields = $this->getExpectedFields($item);
            $checkResult = checkFields($item, $expectedFields);
            if ($checkResult === false) {
                throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
            }

            $itemData = $this->preCreate($item);
            $items[] = $itemData;
        }

        $ids = null;
        try {
            $ids = $this->model->createMultiple($items);
        } catch (\Error $e) {
            wlog("Create multiple items error: " . $e->getMessage());
        }
        if (!$ids) {
            throw new \Error($this->createErrorMsg);
        }

        $this->postCreate($ids, $request);

        $this->commit();

        $this->ok(["ids" => $ids]);
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
        $reqData = checkFields($request, $expectedFields);
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

        $this->postUpdate($request);

        $this->commit();

        $this->ok();
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
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
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

        $this->commit();

        $this->ok();
    }
}
