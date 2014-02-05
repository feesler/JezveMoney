<?php
	require_once("../setup.php");

	class apiResponse
	{
		public $result;


		public function render()
		{
			return json_encode($this)
		}
	}


	function fail()
	{
		$respObj = new apiResponse();

		$respObj->result = "fail";

		echo($respObj->render());
		exit();
	}


	function ok()
	{
		$respObj = new apiResponse();

		$respObj->result = "ok";

		echo($respObj->render());
		exit();
	}



	$user_id = User::check();
	if ($user_id != 0)
		ok();

	if (!isset($_GET["login"]) || !isset($_GET["pwd"]))
		fail();

	if (!User::login($_GET["login"], $_GET["pwd"]))
		fail();

	ok();
?>