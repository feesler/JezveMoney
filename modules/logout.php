<?php

session_start();
session_unset();
session_destroy();

setLocation("../login.php");

?>