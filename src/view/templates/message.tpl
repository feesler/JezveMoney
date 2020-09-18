<?php
	use JezveMoney\Core\JSON;
?>
	onReady(function(){ createMessage(<?=JSON::encode($msgMessage)?>, '<?=$msgClass?>'); });
