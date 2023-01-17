<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\Core\MySqlDB;

/**
 * DB queries controller
 */
class Query extends AdminController
{
    protected $db = null;
    protected $tableName = "admin_query";

    /**
     * Controller initialization
     */
    public function onStart()
    {
        $this->db = MySqlDB::getInstance();
    }

    /**
     * /admin/query/ route handler
     * Renders queries view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "Query.tpl");
        $data = [
            "titleString" => "Admin panel | DB queries",
            "rows" => 0,
            "cols" => 0,
        ];

        $query = null;
        if (isset($_POST["query"]) && $_POST["query"] != "") {
            $query = $_POST["query"];

            if (isset($_POST["qtype"]) && $_POST["qtype"] == "1") {       // select query
                $resArr = [];
                $result = $this->db->rawQ($query);
                $data["qerr_num"] = $this->db->getError();
                $data["qerror"] = $this->db->getMessage();
                if (
                    $result
                    && $result !== true
                    && !is_null($result)
                    && !$data["qerr_num"]
                    && $this->db->rowsCount($result) > 0
                ) {
                    $this->saveQuery($query);

                    while ($row = $this->db->fetchRow($result)) {
                        $resArr[] = $row;
                    }

                    $data["rows"] = count($resArr);
                    $data["cols"] = isset($resArr[0]) ? count($resArr[0]) : 0;
                }
                $data["resArr"] = $resArr;
            }
        }
        $data["query"] = $query;

        $data["latestQueries"] = $this->getLatestQueries();

        $this->cssAdmin[] = "QueriesView.css";
        $this->jsAdmin[] = "QueriesView.js";

        $this->render($data);
    }

    /**
     * Saves query to database
     *
     * @param string $query
     */
    protected function saveQuery(string $query)
    {
        if (!is_string($query) || is_empty($query)) {
            return;
        }

        $latestQueries = $this->getLatestQueries(1);
        if (count($latestQueries) == 1 && $latestQueries[0] == $query) {
            return;
        }

        $escapedQuery = $this->db->escape($query);

        $this->db->insertQ($this->tableName, [
            "id" => null,
            "title" => "",
            "query" => $escapedQuery,
            "flags" => 0
        ]);
    }

    /**
     * Returns array of latest queries
     *
     * @param int $limit count of queries to return
     *
     * @return string[]
     */
    protected function getLatestQueries($limit = 10)
    {
        $limit = intval($limit);

        $res = [];
        $qResult = $this->db->selectQ(
            "query",
            $this->tableName,
            null,
            null,
            "id DESC LIMIT $limit"
        );
        while ($row = $this->db->fetchRow($qResult)) {
            $res[] = $row["query"];
        }

        return $res;
    }
}
