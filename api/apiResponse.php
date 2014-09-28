<?php

	class apiResponse extends apiObject
	{
		public $result;


		public function fail()
		{
			$this->result = "fail";

			echo($this->render());
			exit();
		}


		public function ok()
		{
			$this->result = "ok";

			echo($this->render());
			exit();
		}
	}

?>