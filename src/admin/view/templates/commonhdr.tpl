<!DOCTYPE html>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width,maximum-scale=1,initial-scale=1,user-scalable=0">
<link rel="shortcut icon" href="../favicon.ico" type="image/x-icon">
<title><?=e($titleString)?></title>
<?php	foreach($this->cssArr as $cssFile) {	?>
<link rel="stylesheet" type="text/css" href="<?=e(BASEURL.auto_version("view/css/".$cssFile))?>">
<?php	}	?>
<?php	foreach($this->cssAdmin as $cssFile) {	?>
<link rel="stylesheet" type="text/css" href="<?=e(BASEURL.auto_version("admin/view/css/".$cssFile))?>">
<?php	}	?>
<link rel="stylesheet" type="text/css" href="<?=e(BASEURL."admin/view/themes/".$this->themeStylesheet)?>">
