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


	function fail($acc_id)
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

	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		fail();

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]) ||
		!isset($_GET["pos"]) || !is_numeric($_GET["pos"]))
		fail();

	$tr_id = intval($_GET["id"]);
	$to_pos = intval($_GET["pos"]);
	if (!$tr_id || !$to_pos)
		fail();

	$trans = new Transaction($user_id);
	if (!$trans->updatePos($tr_id, $to_pos))
		fail();

	ok();
?>