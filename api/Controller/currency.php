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
			if (!$this->model->is_exist($curr_id))
				$respObj->fail();

			$currObj = new stdClass;
			$currObj->id = $curr_id;
			$currObj->name = $this->model->getName($curr_id);
			$currObj->sign = $this->model->getSign($curr_id);
			$currObj->format = $this->model->getFormat($curr_id);

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
