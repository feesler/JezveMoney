<?php

class CurrencyApiController extends ApiController
{
	public function index()
	{
		$respObj = new apiResponse;

		if (!isset($_POST["curr_id"]))
			$respObj->fail();
		$curr_id = intval($_POST["curr_id"]);
		if (!$curr_id)
			$respObj->fail();


		if (!CurrencyModel::is_exist($curr_id))
			$respObj->fail();

		$currName = CurrencyModel::getName($curr_id);
		$currSign = CurrencyModel::getSign($curr_id);
		$currFormat = CurrencyModel::getFormat($curr_id);

		$respObj->data = array("id" => $curr_id, "name" => $currName, "sign" => $currSign, "format" => $currFormat);

		$respObj->ok();
	}


	public function getList()
	{
		$respObj = new apiResponse;

		$respObj->data = CurrencyModel::getArray();
		$respObj->ok();
	}

}
