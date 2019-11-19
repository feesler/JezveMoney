<?php

class CurrencyApiController extends ApiController
{
	public function initAPI()
	{
		parent::initAPI();

		$this->model = new CurrencyModel();
	}


	public function index()
	{
		$respObj = new apiResponse;

		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No currency specified");

		$currArr = [];
		foreach($ids as $curr_id)
		{
			$currObj = $this->model->getItem($curr_id);
			if (!$currObj)
				$respObj->fail();

			$res = new stdClass;
			$res->id = $curr_id;
			$res->name = $currObj->name;
			$res->sign = $currObj->sign;
			$res->format = $currObj->format;

			$currArr[] = $currObj;
		}

		$respObj->data = $currArr;

		$respObj->ok();
	}


	public function getList()
	{
		$respObj = new apiResponse;

		$respObj->data = $this->model->getArray();
		$respObj->ok();
	}

}
