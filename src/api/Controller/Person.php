<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Item\PersonItem;

/**
 * Persons API controller
 */
class Person extends ApiListController
{
    protected $requiredFields = ["name", "flags"];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = PersonModel::getInstance();
        $this->createErrorMsg = __("ERR_PERSON_CREATE");
        $this->updateErrorMsg = __("ERR_PERSON_UPDATE");
        $this->deleteErrorMsg = __("ERR_PERSON_DELETE");
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
        return new PersonItem($item);
    }

    /**
     * Shows person(s)
     */
    public function show()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error(__("ERR_NO_IDS"));
        }

        $this->begin();

        if (!$this->model->show($ids)) {
            throw new \Error(__("ERR_PERSON_SHOW"));
        }

        $this->commit();

        $this->ok();
    }

    /**
     * Hides person(s)
     */
    public function hide()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error(__("ERR_NO_IDS"));
        }

        $this->begin();

        if (!$this->model->hide($ids)) {
            throw new \Error(__("ERR_PERSON_HIDE"));
        }

        $this->commit();

        $this->ok();
    }
}
