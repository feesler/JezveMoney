<?php

class CurrencyApiController extends ApiController
{
	public function index()
	{
		$respObj = new apiResponse;

		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No currency specified");

		$currArr = [];
		foreach($ids as $curr_id)
		{
			if (!CurrencyModel::is_exist($curr_id))
				$respObj->fail();

			$currObj = new stdClass;
			$currObj->id = $curr_id;
			$currObj->name = CurrencyModel::getName($curr_id);
			$currObj->sign = CurrencyModel::getSign($curr_id);
			$currObj->format = CurrencyModel::getFormat($curr_id);

			$currArr[] = $currObj;
		}

		$respObj->data = $currArr;

		$respObj->ok();
	}


	public function getList()
	{
		$respObj = new apiResponse;

		$respObj->data = CurrencyModel::getArray();
		$respObj->ok();
	}

}
