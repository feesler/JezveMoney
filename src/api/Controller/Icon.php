<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Item\IconItem;


class Icon extends ApiController
{
	protected $requiredFields = [ "name", "file", "type" ];
	protected $model = NULL;


	public function initAPI()
	{
		parent::initAPI();

		$this->model = IconModel::getInstance();
	}


	public function index()
	{
		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No currency specified");

		$res = [];
		foreach($ids as $item_id)
		{
			$item = $this->model->getItem($item_id);
			if (!$item)
				$this->fail("Icon $item_id not found");

			$res[] = new IconItem($item);
		}

		$this->ok($res);
	}


	public function getList()
	{
		$res = [];
		$itemsData = $this->model->getData();
		foreach($itemsData as $item)
		{
			$res[] = new IconItem($item);
		}

		$this->ok($res);
	}


	protected function create()
	{
		$defMsg = ERR_ICON_CREATE;

		if (!$this->isPOST())
			$this->fail($defMsg);

		$request = $this->getRequestData();
		$reqData = checkFields($request, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		$curr_id = $this->model->create($reqData);
		if (!$curr_id)
			$this->fail($defMsg);

		$this->ok([ "id" => $curr_id ]);
	}


	protected function update()
	{
		$defMsg = ERR_ICON_UPDATE;

		if (!$this->isPOST())
			$this->fail($defMsg);

		$request = $this->getRequestData();
		if (!$request || !isset($request["id"]))
			$this->fail($defMsg);

		$reqData = checkFields($request, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		if (!$this->model->update($request["id"], $reqData))
			$this->fail($defMsg);

		$this->ok();
	}


	protected function del()
	{
		$defMsg = ERR_ICON_DELETE;

		if (!$this->isPOST())
			$this->fail($defMsg);

		$ids = $this->getRequestedIds(TRUE, $this->isJsonContent());
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No item specified");

		if (!$this->model->del($ids))
			$this->fail($defMsg);

		$this->ok();
	}
}
