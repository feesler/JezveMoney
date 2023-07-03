<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiSortableListController;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Model\TransactionModel;

/**
 * Persons API controller
 */
class Person extends ApiSortableListController
{
    protected $transModel = null;
    protected $requiredFields = ["name", "flags"];
    protected $defaultValues = [
        "flags" => 0,
    ];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = PersonModel::getInstance();
        $this->transModel = TransactionModel::getInstance();
        $this->createErrorMsg = __("persons.errors.create");
        $this->updateErrorMsg = __("persons.errors.update");
        $this->deleteErrorMsg = __("persons.errors.delete");
        $this->changePosErrorMsg = __("persons.errors.changePos");
    }

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
        if ($isList) {
            return $item;
        }

        $res = $item;
        $res->transactionsCount = $this->transModel->getTransCount([
            "persons" => $item->id,
        ]);

        return $res;
    }

    /**
     * Shows person(s)
     */
    public function show()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->runTransaction(function () {
            $ids = $this->getRequestedIds(true, $this->isJsonContent());
            if (!is_array($ids) || !count($ids)) {
                throw new \Error(__("errors.noIds"));
            }

            if (!$this->model->show($ids)) {
                throw new \Error(__("persons.errors.show"));
            }

            $request = $this->getRequestData();
            $result = $this->getStateResult($request);

            $this->ok($result);
        });
    }

    /**
     * Hides person(s)
     */
    public function hide()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->runTransaction(function () {
            $ids = $this->getRequestedIds(true, $this->isJsonContent());
            if (!is_array($ids) || !count($ids)) {
                throw new \Error(__("errors.noIds"));
            }

            if (!$this->model->hide($ids)) {
                throw new \Error(__("persons.errors.hide"));
            }

            $request = $this->getRequestData();
            $result = $this->getStateResult($request);

            $this->ok($result);
        });
    }
}
