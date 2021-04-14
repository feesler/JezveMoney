<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Item\CurrencyItem;

class Currency extends ApiController
{
    protected $requiredFields = ["name", "sign", "flags"];
    protected $model = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->model = CurrencyModel::getInstance();
    }


    public function index()
    {
        $ids = $this->getRequestedIds();
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No currency specified");
        }

        $res = [];
        foreach ($ids as $curr_id) {
            $item = $this->model->getItem($curr_id);
            if (!$item) {
                throw new \Error("Currency $curr_id not found");
            }

            $res[] = new CurrencyItem($item);
        }

        $this->ok($res);
    }


    public function getList()
    {
        $res = [];
        $currencies = $this->model->getData();
        foreach ($currencies as $item) {
            $res[] = new CurrencyItem($item);
        }

        $this->ok($res);
    }


    protected function create()
    {
        $defMsg = Message::get(ERR_CURRENCY_CREATE);

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            throw new \Error($defMsg);
        }

        $curr_id = $this->model->create($reqData);
        if (!$curr_id) {
            throw new \Error($defMsg);
        }

        $this->ok(["id" => $curr_id]);
    }


    protected function update()
    {
        $defMsg = Message::get(ERR_CURRENCY_UPDATE);

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        if (!$request || !isset($request["id"])) {
            throw new \Error();
        }

        $reqData = checkFields($request, $this->requiredFields);
        if ($reqData === false) {
            throw new \Error();
        }

        if (!$this->model->update($request["id"], $reqData)) {
            throw new \Error();
        }

        $this->ok();
    }


    protected function del()
    {
        $defMsg = Message::get(ERR_CURRENCY_DELETE);

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No currency specified");
        }

        if (!$this->model->del($ids)) {
            throw new \Error($defMsg);
        }

        $this->ok();
    }
}
