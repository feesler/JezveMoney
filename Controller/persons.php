<?php

class PersonsController extends Controller
{
	public function index()
	{
		global $u, $user_id, $user_name;

		$pers = new Person($user_id);

		$persArr = $pers->getArray();

		$titleString = "Jezve Money | Persons";

		$cssArr = array("common.css", "tiles.css", "popup.css", "iconlink.css", "toolbar.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "popup.js", "toolbar.js", "persons.js");

		include("./view/templates/persons.tpl");
	}


	public function create()
	{
		global $u, $user_id, $user_name;

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

		$submitHandler = "return onNewPersonSubmit(this);";

		$cssArr = array("common.css", "iconlink.css", "tiles.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "persons.js");

		include("./view/templates/person.tpl");
	}


	public function update()
	{
		global $u, $user_id, $user_name;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->updatePerson();
			return;
		}

		$action = "edit";

		$pName = "";

		if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
			fail(ERR_PERSON_UPDATE);

		$person = new Person($user_id);

		$p_id = intval($_GET["id"]);
		if (!$person->is_exist($p_id))
			fail(ERR_PERSON_UPDATE);

		$pName = $person->getName($p_id);

		$titleString = "Jezve Money | ";
		$headString = "Edit person";
		$titleString .= $headString;

		$submitHandler = "return onEditPersonSubmit(this);";

		$cssArr = array("common.css", "iconlink.css", "tiles.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "persons.js");

		$cssArr[] = "popup.css";
		$jsArr[] = "popup.js";

		include("./view/templates/person.tpl");
	}


	public function createPerson()
	{
		global $user_id;

		$defMsg = ERR_PERSON_CREATE;

		$person = new Person($user_id);
		if (!isset($_POST["pname"]))
			fail($defMsg);

		$person_name = $_POST["pname"];

		$check_id = $person->findByName($person_name);
		if ($check_id != 0)
			fail(ERR_PERSON_UPDATE_EXIST);

		if (!$person->create($person_name))
			fail($defMsg);

		setMessage(MSG_PERSON_CREATE);

		setLocation(BASEURL."persons/");
	}


	public function updatePerson()
	{
		global $user_id;

		$defMsg = ERR_PERSON_UPDATE;

		$person = new Person($user_id);

		if (!isset($_POST["pname"]))
			fail($defMsg);

		$person_name = $_POST["pname"];

		$check_id = $person->findByName($person_name);
		if ($check_id != 0)
			fail(ERR_PERSON_UPDATE_EXIST);

		if (!isset($_POST["pid"]))
			fail($defMsg);

		$person_id = intval($_POST["pid"]);
		if (!$person->edit($person_id, $person_name))
			fail($defMsg);

		setMessage(MSG_PERSON_UPDATE);

		setLocation(BASEURL."persons/");
	}


	public function del()
	{
		global $user_id;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."persons/");

		$defMsg = ERR_PERSON_DELETE;

		$person = new Person($user_id);

		if (!isset($_POST["persons"]))
			fail($defMsg);

		$p_arr = explode(",", $_POST["persons"]);
		foreach($p_arr as $p_id)
		{
			$p_id = intval($p_id);
			if (!$person->del($p_id))
				fail($defMsg);
		}

		setMessage(MSG_PERSON_DELETE);

		setLocation(BASEURL."persons/");
	}
}
