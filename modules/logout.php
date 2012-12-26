<?php

require_once("../setup.php");

session_start();
session_unset();
session_destroy();

deleteCookies();

setLocation("../login.php");

?>