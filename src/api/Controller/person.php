<?php

class PersonApiController extends ApiController
{
	protected $requiredFields = [ "name" ];


	public function initAPI()
	{
		parent::initAPI();

		$this->model = PersonModel::getInstance();
	}


	public function index()
	{
		wlog("PersonApiController::index()");

		$respObj = new apiResponse;

		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No persons specified");

		$res = [];
		foreach($ids as $person_id)
		{
			$item = $this->model->getItem($person_id);
			if (!$item)
				$respObj->fail("Person $person_id not found");

			$res[] = new Person($item);
		}

		$respObj->data = $res;
		$respObj->ok();
	}


	public function getList()
	{
		wlog("PersonApiController::getList()");

		$respObj = new apiResponse;

		$res = [];
		$persons = $this->model->getData();
		foreach($persons as $item)
		{
			$res[] = new Person($item);
		}

		$respObj->data = $res;
		$respObj->ok();
	}


	public function create()
	{
		wlog("PersonApiController::create()");

		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$respObj->fail();

		$p_id = $this->model->create($reqData);
		if (!$p_id)
			$respObj->fail();

		$respObj->data = ["id" => $p_id];
		$respObj->ok();
	}


	public function update()
	{
		wlog("PersonApiController::update()");

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


	public function del()
	{
		wlog("PersonApiController::update()");

		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$ids = $this->getRequestedIds(TRUE);
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No persons specified");

		if (!$this->model->del($ids))
			$respObj->fail();

		$respObj->ok();
	}


}
