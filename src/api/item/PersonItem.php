<?php

namespace JezveMoney\App\Item;

use JezveMoney\App\Model\AccountModel;


class Person
{
	public $id = 0;
	public $name = NULL;
	public $flags = 0;
	public $accounts = NULL;


	public function __construct($obj)
	{
		if (is_null($obj))
			throw new \Error("Invalid object");

		$this->id = $obj->id;
		$this->name = $obj->name;
		$this->flags = $obj->flags;

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
			$personAcc = new \stdClass;
			$personAcc->id = $account->id;
			$personAcc->curr_id = $account->curr_id;
			$personAcc->balance = $account->balance;

			$this->accounts[] = $personAcc;
		}
	}
}
