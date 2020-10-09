<?php
use JezveMoney\Core\JSON;
use JezveMoney\Core\Message;
?>
<?php	foreach($this->jsArr as $jsFile) {	?>
<script type="text/javascript" src="<?=e(BASEURL.auto_version("view/js/".$jsFile))?>"></script>
<?php	}	?>
<script>
    var baseURL = '<?=BASEURL?>';
    var themes = <?=JSON::encode((object)$this->themes)?>;
<?php		Message::check();		?>
</script>
