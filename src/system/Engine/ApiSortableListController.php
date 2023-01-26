<?php

namespace JezveMoney\Core;

/**
 * Sortable list API controller
 */
class ApiSortableListController extends ApiListController
{
    protected $changePosErrorMsg = null;
    protected $changePosFields = ["id", "pos"];

    /**
     * Updates position of item
     */
    public function setPos()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $this->changePosFields);
        if ($reqData === false) {
            throw new \Error(__("ERR_INVALID_REQUEST_DATA"));
        }

        $this->begin();

        if (!$this->model->updatePosition($reqData)) {
            throw new \Error($this->changePosErrorMsg);
        }

        $this->commit();

        $this->ok();
    }
}
