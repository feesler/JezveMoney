<?php
	require_once("../setup.php");

	class apiResponse
	{
		public $result;


		public function render()
		{
			return f_json_encode($this);
		}
	}


	function fail()
	{
		global $respObj;

		$respObj->result = "fail";

		echo($respObj->render());
		exit();
	}


	function ok()
	{
		global $respObj;

		$respObj->result = "ok";

		echo($respObj->render());
		exit();
	}

	$respObj = new apiResponse();

	$user_id = User::check();
	if ($user_id == 0)
		fail();

	$acc = new Account($user_id);
	$respObj->data = $acc->getArray();

	ok();
?>