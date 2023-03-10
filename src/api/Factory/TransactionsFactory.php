<?php

namespace JezveMoney\App\API\Factory;

use JezveMoney\App\Model\TransactionModel;
use JezveMoney\Core\Singleton;

/**
 * Transactions API factory
 */
class TransactionsFactory
{
    use Singleton;

    protected $model = null;

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $this->model = TransactionModel::getInstance();
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
        $defaultParams = [
            "onPage" => 10,
            "page" => 0
        ];

        $res = $this->model->getRequestFilters($request, $defaultParams, true);

        // Order request is available only from API
        if (
            isset($request["order"]) &&
            is_string($request["order"]) &&
            strtolower($request["order"]) == "desc"
        ) {
            $res["desc"] = true;
        }

        if (isset($request["count"]) && is_numeric($request["count"])) {
            $res["onPage"] = intval($request["count"]);
        }

        return $res;
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
        return $this->model->getData($request);
    }

    /**
     * Read items list
     */
    public function getList($data)
    {
        $res = new \stdClass();

        $request = $this->prepareListRequest($data);

        $res->items = $this->getListItems($request);
        $res->filter = (object)$this->model->getFilterObject($request);
        $res->order = (isset($request["desc"]) && $request["desc"] === true)
            ? "desc"
            : "asc";

        $transCount = $this->model->getTransCount($request);
        $pagesCount = ($request["onPage"] > 0)
            ? ceil($transCount / $request["onPage"])
            : 1;

        $currentPage = (isset($request["page"]) ? intval($request["page"]) : 0) + 1;
        $res->pagination = [
            "total" => $transCount,
            "onPage" => $request["onPage"],
            "pagesCount" => $pagesCount,
            "page" => $currentPage
        ];
        if (isset($request["range"])) {
            $res->pagination["range"] = intval($request["range"]);
        }

        return $res;
    }
}
