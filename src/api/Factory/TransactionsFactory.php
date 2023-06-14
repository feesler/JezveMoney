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
        $requestDefaults = [
            "onPage" => 10,
            "page" => 1,
            "range" => 1,
        ];

        $res = $this->model->getRequestFilters($request, $requestDefaults, true);
        $request = array_merge($requestDefaults, $request);

        // Order request is available only from API
        if (
            isset($request["order"])
            && is_string($request["order"])
            && strtolower($request["order"]) == "desc"
            && is_array($res["params"])
        ) {
            $res["params"]["desc"] = true;
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
        $params = $request["params"];

        $res->items = $this->getListItems($params);
        $res->filter = $request["filter"];
        $res->pagination = $request["pagination"];
        $res->order = (isset($params["desc"]) && $params["desc"] === true)
            ? "desc"
            : "asc";

        return $res;
    }
}
