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
		$res->accounts->data = $this->accModel->getData([ "full" => TRUE ]);
		$res->accounts->autoincrement = $this->accModel->autoIncrement();

		$res->transactions = new stdClass;
		$res->transactions->data = [];
		$items = $this->trModel->getData([ "onPage" => 0 ]);
		foreach($items as $item)
		{
			$item->date = date("d.m.Y", $item->date);

			$res->transactions->data[] = $item;
		}
		$res->transactions->autoincrement = $this->trModel->autoIncrement();

		$res->persons = new stdClass;
		$res->persons->data = $this->pModel->getData();
		$res->persons->autoincrement = $this->pModel->autoIncrement();

		$respObj->data = $res;
		$respObj->ok();
	}
}