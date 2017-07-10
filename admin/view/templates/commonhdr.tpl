<!DOCTYPE html>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width,maximum-scale=1,initial-scale=1,user-scalable=0">
<link rel="shortcut icon" href="../favicon.ico" type="image/x-icon">
<title><?=$titleString?></title>
<?php	foreach($cssMainArr as $cssFile) {	?>
<link rel="stylesheet" type="text/css" href="<?=BASEURL.auto_version("view/css/".$cssFile)?>">
<?php	}	?>
<?php	foreach($cssLocalArr as $cssFile) {	?>
<link rel="stylesheet" type="text/css" href="<?=BASEURL.auto_version("admin/view/css/".$cssFile)?>">
<?php	}	?>
<!--[if lte IE 8]>
<link rel="stylesheet" type="text/css" href="../view/css/ie8.css">
<![endif]-->
<?php	foreach($jsMainArr as $jsFile) {	?>
<script type="text/javascript" src="<?=BASEURL.auto_version("view/js/".$jsFile)?>"></script>
<?php	}	?>
<?php	foreach($jsLocalArr as $jsFile) {	?>
<script type="text/javascript" src="<?=BASEURL.auto_version("admin/view/js/".$jsFile)?>"></script>
<?php	}	?>
<script>
var baseURL = '<?=BASEURL?>';
</script>
