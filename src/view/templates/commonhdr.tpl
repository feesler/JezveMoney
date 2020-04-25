<!DOCTYPE html>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width,maximum-scale=1,initial-scale=1,user-scalable=0">
<link rel="shortcut icon" href="<?=BASEURL?>favicon.ico" type="image/x-icon">
<link rel="apple-touch-icon" sizes="180x180" href="<?=BASEURL?>view/img/icon_180.png">
<meta name="msapplication-square70x70logo" content="<?=BASEURL?>view/img/icon_70.png">
<meta name="msapplication-square150x150logo" content="<?=BASEURL?>view/img/icon_150.png">
<meta name="msapplication-square310x310logo" content="<?=BASEURL?>view/img/icon_310.png">
<meta name="msapplication-wide310x150logo" content="<?=BASEURL?>view/img/icon_310rect.png">
<meta name="msapplication-TileColor" content="#20A0FF">
<link rel="manifest" href="/manifest.webmanifest">
<title><?=e($titleString)?></title>
<?php	foreach($this->cssArr as $cssFile) {	?>
<link rel="stylesheet" type="text/css" href="<?=e(BASEURL.auto_version("view/css/".$cssFile))?>">
<?php	}	?>
