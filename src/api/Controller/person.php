<?php

class PersonApiController extends ApiController
{
	public function initAPI()
	{
		parent::initAPI();

		$this->personMod = PersonModel::getInstance();
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
			$personObj = $this->personMod->getItem($person_id);
			if ($personObj)
				$res[] = $personObj;
		}

		$respObj->data = $res;
		$respObj->ok();
	}


	public function getList()
	{
		wlog("PersonApiController::getList()");

		$respObj = new apiResponse;

		$respObj->data = $this->personMod->getData();
		$respObj->ok();
	}


	public function create()
	{
		wlog("PersonApiController::create()");

		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["name"]))
			$respObj->fail();

		$p_id = $this->personMod->create([ "name" => $_POST["name"] ]);
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

		if (!isset($_POST["id"]) || !isset($_POST["name"]))
			$respObj->fail();

		if (!$this->personMod->update($_POST["id"], [ "name" => $_POST["name"] ]))
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

		foreach($ids as $item_id)
		{
			$item_id = intval($item_id);
			if (!$item_id)
				continue;

			if (!$this->personMod->del($item_id))
				$respObj->fail();
		}

		$respObj->ok();
	}


}
