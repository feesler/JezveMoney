<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\ImportRuleItem;

use function JezveMoney\Core\qnull;

class ImportRuleModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;
    protected $tbl_name = "import_rule";

    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

        $this->dbObj = MySqlDB::getInstance();
        $this->condModel = ImportConditionModel::getInstance();
        $this->actionModel = ImportActionModel::getInstance();
    }


    // Convert DB row to item object
    protected function rowToObj($row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new \stdClass();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->flags = intval($row["flags"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }


    // Called from CachedTable::updateCache() and return data query object
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name);
    }


    protected function checkParams($params, $isUpdate = false)
    {
        $avFields = ["flags"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$isUpdate && !checkFields($params, $avFields)) {
            return null;
        }

        if (isset($params["flags"])) {
            $res["flags"] = intval($params["flags"]);
        }

        return $res;
    }


    // Preparations for item create
    protected function preCreate($params, $isMultiple = false)
    {
        $res = $this->checkParams($params);
        if (is_null($res)) {
            return null;
        }

        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $res["user_id"] = self::$user_id;

        return $res;
    }


    // Preparations for item update
    protected function preUpdate($item_id, $params)
    {
        // check item is exist
        $ruleObj = $this->getItem($item_id);
        if (!$ruleObj) {
            return false;
        }

        $res = $this->checkParams($params, true);
        if (is_null($res)) {
            return null;
        }

        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    // Preparations for item delete
    protected function preDelete($items)
    {
        foreach ($items as $item_id) {
            // check item is exist
            $itemObj = $this->getItem($item_id);
            if (!$itemObj) {
                return false;
            }
        }

        $res = $this->condModel->deleteRuleConditions($items);
        if (!$res) {
            return false;
        }

        return $this->actionModel->deleteRuleActions($items);
    }


    // Return array of items
    public function getData($params = [])
    {
        if (!is_array($params)) {
            $params = [];
        }

        $requestAll = (isset($params["full"]) && $params["full"] == true && UserModel::isAdminUser());
        $addExtended = isset($params["extended"]) && $params["extended"] == true;

        $itemsData = [];
        if ($requestAll) {
            $qResult = $this->dbObj->selectQ("*", $this->tbl_name, null, null, "id ASC");
            while ($row = $this->dbObj->fetchRow($qResult)) {
                $itemObj = $this->rowToObj($row);
                if ($itemObj) {
                    $itemsData[] = $itemObj;
                }
            }
        } else {
            if (!$this->checkCache()) {
                return null;
            }

            $itemsData = $this->cache;
        }

        $res = [];
        foreach ($itemsData as $item) {
            $itemObj = new ImportRuleItem($item, $requestAll);
            if ($addExtended) {
                $itemObj->conditions = $this->condModel->getRuleConditions($item->id);
                $itemObj->actions = $this->actionModel->getRuleActions($item->id);
            }
            $res[] = $itemObj;
        }

        return $res;
    }
}
