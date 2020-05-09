<?php

class CurrencyApiController extends ApiController
{
	protected $requiredFields = [ "name", "sign", "format" ];


	public function initAPI()
	{
		parent::initAPI();

		$this->model = CurrencyModel::getInstance();
	}


	public function index()
	{
		$respObj = new apiResponse;

		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No currency specified");

		$res = [];
		foreach($ids as $curr_id)
		{
			$item = $this->model->getItem($curr_id);
			if (!$item)
				$respObj->fail("Currency $curr_id not found");

			$res[] = new Currency($item);
		}

		$respObj->data = $res;
		$respObj->ok();
	}


	public function getList()
	{
		$respObj = new apiResponse;

		$res = [];
		$currencies = $this->model->getData();
		foreach($currencies as $item)
		{
			$res[] = new Currency($item);
		}

		$respObj->data = $res;
		$respObj->ok();
	}


	protected function create()
	{
		$defMsg = ERR_CURRENCY_CREATE;
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail($defMsg);

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$respObj->fail($defMsg);

		$curr_id = $this->model->create($reqData);
		if (!$curr_id)
			$respObj->fail($defMsg);

		$respObj->data = ["id" => $curr_id];
		$respObj->ok();
	}


	protected function update()
	{
		$defMsg = ERR_CURRENCY_UPDATE;
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["id"]))
			$respObj->fail();

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$respObj->fail();

		if (!$this->model->update($_POST["id"], $reqData))
			$respObj->fail();

		$respObj->ok();
	}


	protected function del()
	{
		$defMsg = ERR_CURRENCY_DELETE;
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail($defMsg);

		$ids = $this->getRequestedIds(TRUE);
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No currency specified");

		if (!$this->model->del($ids))
			$respObj->fail($defMsg);

		$respObj->ok();
	}
}
