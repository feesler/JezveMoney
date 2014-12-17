<!DOCTYPE html>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width,maximum-scale=1,initial-scale=1,user-scalable=0">
<link rel="shortcut icon" href="<?=BASEURL?>favicon.ico" type="image/x-icon">
<title><?=$titleString?></title>
<?php	foreach($cssArr as $cssFile) {	?>
<link rel="stylesheet" type="text/css" href="<?=BASEURL?>view/css/<?=$cssFile?>">
<?php	}	?>
<!--[if lte IE 8]>
<link rel="stylesheet" type="text/css" href="<?=BASEURL?>view/css/ie8.css">
<![endif]-->
<?php	foreach($jsArr as $jsFile) {	?>
<script type="text/javascript" src="<?=BASEURL?>view/js/<?=$jsFile?>"></script>
<?php	}	?>