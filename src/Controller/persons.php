<?php

class PersonsController extends Controller
{
	protected $requiredFields = [ "name" ];

	
	public function index()
	{
		$persArr = $this->personMod->getData();

		$titleString = "Jezve Money | Persons";

		array_push($this->css->libs, "tiles.css", "iconlink.css", "toolbar.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "toolbar.js", "persons.js");

		include(TPL_PATH."persons.tpl");
	}


	private function fail($msg = NULL)
	{
		if (!is_null($msg))
			Message::set($msg);
		setLocation(BASEURL."persons/");
	}


	public function create()
	{
		if ($this->isPOST())
		{
			$this->createPerson();
			return;
		}

		$action = "new";

		$pName = "";

		$titleString = "Jezve Money | ";
		$headString = "New person";
		$titleString .= $headString;

		array_push($this->css->libs, "iconlink.css", "tiles.css");
		$this->buildCSS();
		array_push($this->jsArr, "persons.js");

		include(TPL_PATH."person.tpl");
	}


	public function update()
	{
		if ($this->isPOST())
		{
			$this->updatePerson();
			return;
		}

		$action = "edit";

		$pName = "";

		$p_id = intval($this->actionParam);
		if (!$p_id)
			$this->fail(ERR_PERSON_UPDATE);

		$pObj = $this->personMod->getItem($p_id);
		if (!$pObj)
			$this->fail(ERR_PERSON_UPDATE);

		$pName = $pObj->name;

		$titleString = "Jezve Money | ";
		$headString = "Edit person";
		$titleString .= $headString;

		array_push($this->css->libs, "iconlink.css", "tiles.css");
		$this->buildCSS();
		array_push($this->jsArr, "selection.js", "persons.js");

		include(TPL_PATH."person.tpl");
	}


	protected function createPerson()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."persons/");

		$defMsg = ERR_PERSON_CREATE;

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);
			
		if (!$this->personMod->create($reqData))
			$this->fail($defMsg);

		Message::set(MSG_PERSON_CREATE);

		setLocation(BASEURL."persons/");
	}


	protected function updatePerson()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."persons/");

		$defMsg = ERR_PERSON_UPDATE;

		if (!isset($_POST["id"]))
			$this->fail($defMsg);

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$respObj->fail($defMsg);

		if (!$this->personMod->update($_POST["id"], $reqData))
			$this->fail($defMsg);

		Message::set(MSG_PERSON_UPDATE);

		setLocation(BASEURL."persons/");
	}


	public function del()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."persons/");

		$defMsg = ERR_PERSON_DELETE;

		if (!isset($_POST["persons"]))
			$this->fail($defMsg);

		$ids = explode(",", rawurldecode($_POST["persons"]));
		if (!$this->personMod->del($ids))
			$this->fail($defMsg);

		Message::set(MSG_PERSON_DELETE);

		setLocation(BASEURL."persons/");
	}
}
