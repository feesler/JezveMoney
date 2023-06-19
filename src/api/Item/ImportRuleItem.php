<?php

namespace JezveMoney\App\Item;

use JezveMoney\App\Model\ImportActionModel;
use JezveMoney\App\Model\ImportConditionModel;
use JezveMoney\App\Model\UserModel;

class ImportRuleItem
{
    public $id = 0;
    public $flags = 0;
    public $user_id = 0;
    public $createdate = 0;
    public $updatedate = 0;
    public $conditions = null;
    public $actions = null;

    /**
     * Converts table row from database to ImportRuleItem object
     *
     * @param array|null $row
     *
     * @return ImportRuleItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->flags = intval($row["flags"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }

    /**
     * Returns import rules object for client
     *
     * @param mixed $item
     * @param array $params array of options:
     *     - 'extended' => (bool) - return extenden rule object, default is false
     *
     * @return \stdClass
     */
    public static function getUserData(mixed $item, array $params = [])
    {
        if (!is_array($item) && !is_object($item)) {
            throw new \Error("Invalid item");
        }

        $item = (object)$item;

        $requestAll = (isset($params["full"]) && $params["full"] == true && UserModel::isAdminUser());
        $addExtended = isset($params["extended"]) && $params["extended"] == true;

        $res = new \stdClass();
        $res->id = $item->id;
        $res->flags = $item->flags;
        $res->createdate = $item->createdate;
        $res->updatedate = $item->updatedate;

        if ($requestAll) {
            $res->user_id = $item->user_id;
        }

        if ($addExtended) {
            $condModel = ImportConditionModel::getInstance();
            $res->conditions = $condModel->getRuleConditions($res->id);

            $actionModel = ImportActionModel::getInstance();
            $res->actions = $actionModel->getRuleActions($res->id);
        }

        return $res;
    }
}
