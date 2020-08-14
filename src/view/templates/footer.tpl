<?php	foreach($this->jsArr as $jsFile) {	?>
<script type="text/javascript" src="<?=e(BASEURL.auto_version("view/js/".$jsFile))?>"></script>
<?php	}	?>
<script>
	var baseURL = '<?=BASEURL?>';
<?php		Message::check();		?>
</script>
