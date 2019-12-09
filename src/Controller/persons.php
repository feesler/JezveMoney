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

		include("./view/templates/persons.tpl");
	}


	private function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation(BASEURL."persons/");
	}


	public function create()
	{
		if ($_SERVER["REQUEST_METHOD"] == "POST")
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

		include("./view/templates/person.tpl");
	}


	public function update()
	{
		if ($_SERVER["REQUEST_METHOD"] == "POST")
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
		array_push($this->jsArr, "persons.js");

		include("./view/templates/person.tpl");
	}


	public function createPerson()
	{
		$defMsg = ERR_PERSON_CREATE;

		if (!isset($_POST["pname"]))
			$this->fail($defMsg);

		$person_name = $_POST["pname"];

		$check_id = $this->personMod->findByName($person_name);
		if ($check_id != 0)
			$this->fail(ERR_PERSON_UPDATE_EXIST);

		if (!$this->personMod->create([ "name" => $person_name ]))
			$this->fail($defMsg);

		setMessage(MSG_PERSON_CREATE);

		setLocation(BASEURL."persons/");
	}


	public function updatePerson()
	{
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

		setMessage(MSG_PERSON_UPDATE);

		setLocation(BASEURL."persons/");
	}


	public function del()
	{
		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."persons/");

		$defMsg = ERR_PERSON_DELETE;

		if (!isset($_POST["persons"]))
			$this->fail($defMsg);

		$p_arr = explode(",", $_POST["persons"]);
		foreach($p_arr as $p_id)
		{
			$p_id = intval($p_id);
			if (!$this->personMod->del($p_id))
				$this->fail($defMsg);
		}

		setMessage(MSG_PERSON_DELETE);

		setLocation(BASEURL."persons/");
	}
}
