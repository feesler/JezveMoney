<?php
use JezveMoney\Core\JSON;
use JezveMoney\Core\Message;
?>
<script>
    window.addEventListener('error', function(e) {
        if (window.parent) {
            window.parent.postMessage(e.error, '*');
        }
    }, true);
</script>
<?php	foreach($this->jsArr as $jsFile) {	?>
<script type="text/javascript" src="<?=e(BASEURL.auto_version("view/js/".$jsFile))?>"></script>
<?php	}	?>
<script>
    var baseURL = '<?=BASEURL?>';
    var themes = <?=JSON::encode((object)$this->themes)?>;
<?php		Message::check();		?>
</script>
