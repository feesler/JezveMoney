<?php
    use JezveMoney\Core\Message;
?>
<script>
    var baseURL = '<?=BASEURL?>';
<?php		Message::check();		?>
</script>
<?php	foreach($this->jsArr as $jsFile) {	?>
<script type="text/javascript" src="<?=e(BASEURL.auto_version("view/js/".$jsFile))?>"></script>
<?php	}	?>
<?php	foreach($this->jsAdmin as $jsFile) {	?>
<script type="text/javascript" src="<?=e(BASEURL.auto_version("admin/view/js/".$jsFile))?>"></script>
<?php	}	?>
