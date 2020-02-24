<?php

class PersonsController extends Controller
{
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

		if (!isset($_POST["pname"]))
			$this->fail($defMsg);

		$person_name = $_POST["pname"];

		$check_id = $this->personMod->findByName($person_name);
		if ($check_id != 0)
			$this->fail(ERR_PERSON_UPDATE_EXIST);

		if (!$this->personMod->create([ "name" => $person_name ]))
			$this->fail($defMsg);

		Message::set(MSG_PERSON_CREATE);

		setLocation(BASEURL."persons/");
	}


	protected function updatePerson()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."persons/");

		$defMsg = ERR_PERSON_UPDATE;

		if (!isset($_POST["pname"]))
			$this->fail($defMsg);

		$person_name = $_POST["pname"];

		$check_id = $this->personMod->findByName($person_name);
		if ($check_id != 0)
			$this->fail(ERR_PERSON_UPDATE_EXIST);

		if (!isset($_POST["pid"]))
			$this->fail($defMsg);

		$person_id = intval($_POST["pid"]);
		if (!$this->personMod->update($person_id, [ "name" => $person_name ]))
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
