<?php

class PersonApiController extends ApiController
{
	protected $requiredFields = [ "name", "flags" ];


	public function initAPI()
	{
		parent::initAPI();

		$this->model = PersonModel::getInstance();
	}


	public function index()
	{
		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No persons specified");

		$res = [];
		foreach($ids as $person_id)
		{
			$item = $this->model->getItem($person_id);
			if (!$item)
				$this->fail("Person $person_id not found");

			$res[] = new Person($item);
		}

		$this->ok($res);
	}


	public function getList()
	{
		$params = [];
		if (isset($_GET["full"]) && $_GET["full"] == 1)
			$params["full"] = TRUE;
		if (isset($_GET["type"]))
			$params["type"] = $_GET["type"];

		$res = [];
		$persons = $this->model->getData($params);
		foreach($persons as $item)
		{
			$res[] = new Person($item);
		}

		$this->ok($res);
	}


	public function create()
	{
		if (!$this->isPOST())
			$this->fail();

		$request = $this->getRequestData();
		$reqData = checkFields($request, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail();

		$p_id = $this->model->create($reqData);
		if (!$p_id)
			$this->fail();

		$this->ok([ "id" => $p_id ]);
	}


	public function update()
	{
		if (!$this->isPOST())
			$this->fail();

		$request = $this->getRequestData();
		if (!$request || !isset($request["id"]))
			$this->fail();

		$reqData = checkFields($request, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail();

		if (!$this->model->update($request["id"], $reqData))
			$this->fail();

		$this->ok();
	}


	public function del()
	{
		if (!$this->isPOST())
			$this->fail();

		$ids = $this->getRequestedIds(TRUE, $this->isJsonContent());
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No persons specified");

		if (!$this->model->del($ids))
			$this->fail();

		$this->ok();
	}


}
