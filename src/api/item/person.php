<?php

class Person
{
	public function __construct($obj)
	{
		$this->id = $obj->id;
		$this->name = $obj->name;

		if (isset($obj->accounts) && is_array($obj->accounts))
		{
			$accData = $obj->accounts;
		}
		else
		{
			$accModel = AccountModel::getInstance();
			$accData = $accModel->getData([ "person" => $this->id ]);
		}

		$this->accounts = [];
		foreach($accData as $account)
		{
			$personAcc = new stdClass;
			$personAcc->id = $account->id;
			$personAcc->curr_id = $account->curr_id;
			$personAcc->balance = $account->balance;

			$this->accounts[] = $personAcc;
		}
	}
}
