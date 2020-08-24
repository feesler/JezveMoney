<?php

class StateApiController extends ApiController
{
	public function initAPI()
	{
		parent::initAPI();

		$this->trModel = TransactionModel::getInstance();
		$this->accModel = AccountModel::getInstance();
		$this->pModel = PersonModel::getInstance();
	}


	public function index()
	{
		$res = new stdClass;

		$res->accounts = new stdClass;
		$res->accounts->data = [];
		$items = $this->accModel->getData([ "full" => TRUE, "type" => "all" ]);
		foreach($items as $item)
		{
			$res->accounts->data[] = new Account($item);
		}
		$res->accounts->autoincrement = $this->accModel->autoIncrement();

		$res->transactions = new stdClass;
		$res->transactions->data = [];
		$items = $this->trModel->getData([ "onPage" => 0 ]);
		foreach($items as $item)
		{
			$res->transactions->data[] = new Transaction($item);
		}
		$res->transactions->autoincrement = $this->trModel->autoIncrement();

		$res->persons = new stdClass;
		$res->persons->data = [];
		$items = $this->pModel->getData([ "type" => "all" ]);
		foreach($items as $item)
		{
			$res->persons->data[] = new Person($item);
		}
		$res->persons->autoincrement = $this->pModel->autoIncrement();

		$res->profile = new stdClass;
		$pObj = $this->pModel->getItem($this->owner_id);
		if (!$pObj)
			$this->fail("Person not found");
		$res->profile->user_id = $this->user_id;
		$res->profile->owner_id = $this->owner_id;
		$res->profile->name = $pObj->name;

		$this->ok($res);
	}
}