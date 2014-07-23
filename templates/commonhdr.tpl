<!DOCTYPE html>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width,maximum-scale=1,initial-scale=1,user-scalable=0">
<link rel="shortcut icon" href="./favicon.ico" type="image/x-icon">
<title><?=$titleString?></title>
<?php	foreach($cssArr as $cssFile) {	?>
<link rel="stylesheet" type="text/css" href="./css/<?=$cssFile?>">
<?php	}	?>
<?php	foreach($jsArr as $jsFile) {	?>
<script type="text/javascript" src="./js/<?=$jsFile?>"></script>
<?php	}	?>