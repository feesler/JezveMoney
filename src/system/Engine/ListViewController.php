<?php

namespace JezveMoney\Core;

/**
 * List view template controller
 */
abstract class ListViewController extends TemplateController
{
    protected $model = null;

    public function getRequestedItem()
    {
        $ids = $this->getRequestedIds();
        if (!is_array($ids) || count($ids) !== 1) {
            return null;
        }

        $account = $this->model->getItem($ids[0]);
        return ($account) ? $account->id : null;
    }
}
