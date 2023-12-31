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
     * Performs controller-specific actions after position successfully updated
     *
     * @param array $request request data
     */
    protected function postSetPos(array $request)
    {
        $state = $this->getState($request);
        return (is_null($state)) ? null : ["state" => $state];
    }

    /**
     * Updates position of item
     */
    public function setPos()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->runTransaction(function () {
            $request = $this->getRequestData();
            $reqData = checkFields($request, $this->changePosFields, true);

            if (!$this->model->updatePosition($reqData)) {
                throw new \Error($this->changePosErrorMsg);
            }

            $result = $this->postSetPos($request);

            $this->ok($result);
        });
    }
}
