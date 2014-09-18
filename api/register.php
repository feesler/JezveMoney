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


	$u = new User();
	$user_id = $u->check();
	if ($user_id != 0)		// need to log out first
		fail();

	if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
		fail();

	if (!$u->register($_POST["login"], $_POST["password"], $_POST["name"]))
		fail();


	ok();
?>