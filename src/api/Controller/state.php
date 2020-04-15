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
		$respObj = new apiResponse;

		$res = new stdClass;

		$res->accounts = new stdClass;
		$res->accounts->data = [];
		$items = $this->accModel->getData([ "full" => TRUE ]);
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
		$items = $this->pModel->getData();
		foreach($items as $item)
		{
			$res->persons->data[] = new Person($item);
		}
		$res->persons->autoincrement = $this->pModel->autoIncrement();

		$respObj->data = $res;
		$respObj->ok();
	}
}