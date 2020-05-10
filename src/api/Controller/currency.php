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
		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No currency specified");

		$res = [];
		foreach($ids as $curr_id)
		{
			$item = $this->model->getItem($curr_id);
			if (!$item)
				$this->fail("Currency $curr_id not found");

			$res[] = new Currency($item);
		}

		$this->ok($res);
	}


	public function getList()
	{
		$res = [];
		$currencies = $this->model->getData();
		foreach($currencies as $item)
		{
			$res[] = new Currency($item);
		}

		$this->ok($res);
	}


	protected function create()
	{
		$defMsg = ERR_CURRENCY_CREATE;

		if (!$this->isPOST())
			$this->fail($defMsg);

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		$curr_id = $this->model->create($reqData);
		if (!$curr_id)
			$this->fail($defMsg);

		$this->ok([ "id" => $curr_id ]);
	}


	protected function update()
	{
		$defMsg = ERR_CURRENCY_UPDATE;

		if (!$this->isPOST())
			$this->fail();

		if (!isset($_POST["id"]))
			$this->fail();

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail();

		if (!$this->model->update($_POST["id"], $reqData))
			$this->fail();

		$this->ok();
	}


	protected function del()
	{
		$defMsg = ERR_CURRENCY_DELETE;

		if (!$this->isPOST())
			$this->fail($defMsg);

		$ids = $this->getRequestedIds(TRUE);
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No currency specified");

		if (!$this->model->del($ids))
			$this->fail($defMsg);

		$this->ok();
	}
}
