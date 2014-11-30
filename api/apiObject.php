<?php

	class apiObject
	{
		public function render()
		{
			return f_json_encode($this);
		}
	}
