<!DOCTYPE html>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width,maximum-scale=1,initial-scale=1,user-scalable=0">
<link rel="shortcut icon" href="../favicon.ico" type="image/x-icon">
<title><?=$titleString?></title>
<?php	foreach($this->cssArr as $cssFile) {	?>
<link rel="stylesheet" type="text/css" href="<?=BASEURL.auto_version("view/css/".$cssFile)?>">
<?php	}	?>
<?php	foreach($this->cssAdmin as $cssFile) {	?>
<link rel="stylesheet" type="text/css" href="<?=BASEURL.auto_version("admin/view/css/".$cssFile)?>">
<?php	}	?>
<?php	foreach($this->jsArr as $jsFile) {	?>
<script type="text/javascript" src="<?=BASEURL.auto_version("view/js/".$jsFile)?>"></script>
<?php	}	?>
<?php	foreach($this->jsAdmin as $jsFile) {	?>
<script type="text/javascript" src="<?=BASEURL.auto_version("admin/view/js/".$jsFile)?>"></script>
<?php	}	?>
<?php	foreach($this->jsAdminModule as $jsFile) {	?>
<script type="module" src="<?=BASEURL.auto_version("admin/view/js/".$jsFile)?>"></script>
<?php	}	?>
<script>
var baseURL = '<?=BASEURL?>';

onReady(fixDPI);
</script>
