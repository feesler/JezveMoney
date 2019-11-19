<?php

class PersonsController extends Controller
{
	public function index()
	{
		global $user_id, $user_name, $uMod;

		$pMod = new PersonModel($user_id);

		$persArr = $pMod->getArray();

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
		global $user_id, $user_name, $uMod;

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
		global $user_id, $user_name, $uMod;

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

		$pMod = new PersonModel($user_id);

		$pObj = $pMod->getItem($p_id);
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
		global $user_id;

		$defMsg = ERR_PERSON_CREATE;

		$pMod = new PersonModel($user_id);
		if (!isset($_POST["pname"]))
			$this->fail($defMsg);

		$person_name = $_POST["pname"];

		$check_id = $pMod->findByName($person_name);
		if ($check_id != 0)
			$this->fail(ERR_PERSON_UPDATE_EXIST);

		if (!$pMod->create([ "name" => $person_name ]))
			$this->fail($defMsg);

		setMessage(MSG_PERSON_CREATE);

		setLocation(BASEURL."persons/");
	}


	public function updatePerson()
	{
		global $user_id;

		$defMsg = ERR_PERSON_UPDATE;

		$pMod = new PersonModel($user_id);

		if (!isset($_POST["pname"]))
			$this->fail($defMsg);

		$person_name = $_POST["pname"];

		$check_id = $pMod->findByName($person_name);
		if ($check_id != 0)
			$this->fail(ERR_PERSON_UPDATE_EXIST);

		if (!isset($_POST["pid"]))
			$this->fail($defMsg);

		$person_id = intval($_POST["pid"]);
		if (!$pMod->update($person_id, [ "name" => $person_name ]))
			$this->fail($defMsg);

		setMessage(MSG_PERSON_UPDATE);

		setLocation(BASEURL."persons/");
	}


	public function del()
	{
		global $user_id;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."persons/");

		$defMsg = ERR_PERSON_DELETE;

		$pMod = new PersonModel($user_id);

		if (!isset($_POST["persons"]))
			$this->fail($defMsg);

		$p_arr = explode(",", $_POST["persons"]);
		foreach($p_arr as $p_id)
		{
			$p_id = intval($p_id);
			if (!$pMod->del($p_id))
				$this->fail($defMsg);
		}

		setMessage(MSG_PERSON_DELETE);

		setLocation(BASEURL."persons/");
	}
}
