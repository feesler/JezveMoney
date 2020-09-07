<?php

class DBVersion
{
	use Singleton;

	protected $tbl_name = "dbver";
	protected $latestVersion = 3;
	protected $dbClient = NULL;



	protected function onStart()
	{
		$this->dbClient = MySqlDB::getInstance();

		if (!$this->dbClient->isTableExist($this->tbl_name))
		{
			$this->createTable();
			$this->setVersion(0);
		}
	}


	// Create DB table if not exist
	private function createTable()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$res = $this->dbClient->createTableQ($this->tbl_name,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`version` INT(11) NOT NULL DEFAULT '0', ".
						"PRIMARY KEY (`id`)",
						"DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci");

		return $res;
	}


	private function setVersion($version)
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$version = intval($version);
		if ($version < 0)
			return FALSE;

		$data = [ "version" => $version ];
		if ($version == 0)
			return $this->dbClient->insertQ($this->tbl_name, $data);
		else
			return $this->dbClient->updateQ($this->tbl_name, $data, "id=1");
	}


	public function getCurrentVersion()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$qResult = $this->dbClient->selectQ("version", $this->tbl_name, "id=1");
		if (!$qResult)
			throw new Error("Fail to obtain DB version");

		$row = $this->dbClient->fetchRow($qResult);
		return intval($row["version"]);
	}


	public static function autoUpdate()
	{
		$inst = static::getInstance();

		$current = $inst->getCurrentVersion();
		wlog("DB version: $current");
		if ($current == $inst->latestVersion)
			return;

		if ($current < 1)
			$current = $inst->version1();
		if ($current < 2)
			$current = $inst->version2();
		if ($current < 3)
			$current = $inst->version3();

		$inst->setVersion($inst->latestVersion);
	}


	private function version1()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$res = $this->dbClient->changeColumn("currency", "format", "flags", "INT(11) NOT NULL DEFAULT '0'");
		if (!$res)
			throw new Error("Fail to update currency table");

		return 1;
	}


	private function version2()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$res = $this->dbClient->addColumns("accounts", ["flags" => "INT(11) NOT NULL DEFAULT '0'"]);
		if (!$res)
			throw new Error("Fail to update accounts table");

		return 2;
	}


	private function version3()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$res = $this->dbClient->addColumns("persons", ["flags" => "INT(11) NOT NULL DEFAULT '0'"]);
		if (!$res)
			throw new Error("Fail to update persons table");

		return 3;
	}
}