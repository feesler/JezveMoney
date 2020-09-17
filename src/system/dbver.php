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
			$this->install();
		}
	}


	// Create all tables
	private function install()
	{
		$this->createCurrencyTable();
		$this->createAccountsTable();
		$this->createPersonsTable();
		$this->createTransactionsTable();
		$this->createUsersTable();
		$this->createAdminQueryTable();

		$this->createDBVersionTable();
		$this->setVersion($this->latestVersion);
	}


	// Create DB table if not exist
	private function createDBVersionTable()
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


	public function getLatestVersion()
	{
		return $this->latestVersion;
	}


	public function autoUpdate()
	{
		$current = $this->getCurrentVersion();
		$latest = $this->getLatestVersion();
		wlog("Current DB version: $current; latest: $latest");
		if ($current == $latest)
			return;

		if ($current < 1)
			$current = $this->version1();
		if ($current < 2)
			$current = $this->version2();
		if ($current < 3)
			$current = $this->version3();

		$this->setVersion($this->latestVersion);
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


	private function version4()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$res = $this->dbClient->changeColumn("accounts", "icon", "icon_id", "INT(11) NOT NULL DEFAULT '0'");
		if (!$res)
			throw new Error("Fail to update accounts table");

		$this->createIconTable();

		return 4;
	}


	private function createCurrencyTable()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$tableName = "currency";
		if ($this->dbClient->isTableExist($tableName))
			return;

		$res = $this->dbClient->createTableQ($tableName,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`name` VARCHAR(128) NOT NULL, ".
						"`sign` VARCHAR(64) NOT NULL, ".
						"`flags` INT(11) NOT NULL DEFAULT '0', ".
						"`createdate` DATETIME NOT NULL, ".
						"`updatedate` DATETIME NOT NULL, ".
						"PRIMARY KEY (`id`)",
						"DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci");
		if (!$res)
			throw new Error("Fail to create table $tableName");
	}


	private function createAccountsTable()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$tableName = "accounts";
		if ($this->dbClient->isTableExist($tableName))
			return;

		$res = $this->dbClient->createTableQ($tableName,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`owner_id` INT(11) NOT NULL, ".
						"`user_id` INT(11) NOT NULL, ".
						"`curr_id` INT(11) NOT NULL, ".
						"`balance` DECIMAL(15,2) NOT NULL, ".
						"`initbalance` DECIMAL(15,2) NOT NULL, ".
						"`name` VARCHAR(255) NOT NULL, ".
						"`icon` INT(11) NOT NULL DEFAULT '0', ".
						"`flags` INT(11) NOT NULL DEFAULT '0', ".
						"`createdate` DATETIME NOT NULL, ".
						"`updatedate` DATETIME NOT NULL, ".
						"PRIMARY KEY (`id`), ".
						"KEY `user_id` (`user_id`)",
						"DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci");
		if (!$res)
			throw new Error("Fail to create table $tableName");
	}


	private function createPersonsTable()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$tableName = "persons";
		if ($this->dbClient->isTableExist($tableName))
			return;

		$res = $this->dbClient->createTableQ($tableName,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`name` VARCHAR(255) NOT NULL, ".
						"`user_id` INT(11) NOT NULL, ".
						"`flags` INT(11) NOT NULL, ".
						"`createdate` DATETIME NOT NULL, ".
						"`updatedate` DATETIME NOT NULL, ".
						"PRIMARY KEY (`id`)",
						"DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci");
		if (!$res)
			throw new Error("Fail to create table $tableName");
	}


	private function createTransactionsTable()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$tableName = "transactions";
		if ($this->dbClient->isTableExist($tableName))
			return;

		$res = $this->dbClient->createTableQ($tableName,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`user_id` INT(11) NOT NULL, ".
						"`src_id` INT(11) NOT NULL, ".
						"`dest_id` INT(11) NOT NULL, ".
						"`type` INT(11) NOT NULL, ".
						"`src_amount` DECIMAL(15,2) NOT NULL, ".
						"`dest_amount` DECIMAL(15,2) NOT NULL, ".
						"`src_curr` INT(11) NOT NULL, ".
						"`dest_curr` INT(11) NOT NULL, ".
						"`date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ".
						"`comment` text NOT NULL, ".
						"`pos` INT(11) NOT NULL, ".
						"`createdate` DATETIME NOT NULL, ".
						"`updatedate` DATETIME NOT NULL, ".
						"`src_result` DECIMAL(15,2) NOT NULL, ".
						"`dest_result` DECIMAL(15,2) NOT NULL, ".
						"PRIMARY KEY (`id`)",
						"DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci");
		if (!$res)
			throw new Error("Fail to create table $tableName");
	}


	private function createUsersTable()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$tableName = "users";
		if ($this->dbClient->isTableExist($tableName))
			return;

		$res = $this->dbClient->createTableQ($tableName,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`login` VARCHAR(255) NOT NULL, ".
						"`passhash` VARCHAR(64) NOT NULL, ".
						"`owner_id` INT(11) NOT NULL, ".
						"`access` INT(11) NOT NULL DEFAULT '0', ".
						"`createdate` DATETIME NOT NULL, ".
						"`updatedate` DATETIME NOT NULL, ".
						"PRIMARY KEY (`id`)",
						"DEFAULT CHARACTER SET = utf8mb4 COLLATE utf8mb4_general_ci");
		if (!$res)
			throw new Error("Fail to create table $tableName");
	}


	private function createAdminQueryTable()
	{
		if (!$this->dbClient)
			throw new Error("Invalid DB client");

		$tableName = "admin_query";
		if ($this->dbClient->isTableExist($tableName))
			return;

		$res = $this->dbClient->createTableQ($tableName,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`title` VARCHAR(255) NOT NULL, ".
						"`query` TEXT NOT NULL, ".
						"`flags` INT(11) NOT NULL DEFAULT '0', ".
						"PRIMARY KEY (`id`)",
						"DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci");
		if (!$res)
			throw new Error("Fail to create table $tableName");
	}
}