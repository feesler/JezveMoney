<?php
use JezveMoney\Core\JSON;
use JezveMoney\Core\Message;
?>
<script>
    window.app = <?=(isset($viewData) ? $viewData : "{}")?>;
    window.addEventListener('error', function(e) {
        if (window.parent) {
            window.parent.postMessage(e.error, '*');
        }
    }, true);
<?php		Message::check();		?>
</script>
<?php	foreach($this->jsArr as $jsFile) {	?>
<script type="text/javascript" src="<?=e(BASEURL.auto_version("view/js/".$jsFile))?>"></script>
<?php	}	?>
