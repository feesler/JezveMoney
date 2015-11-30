<?php

	class apiResponse
	{
		public function render()
		{
			return f_json_encode($this);
		}


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
