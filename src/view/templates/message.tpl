<?php
    use JezveMoney\Core\JSON;
?>
if (!window.app) {
    window.app = {};
}
window.app.message = { title: <?=JSON::encode($msgMessage)?>, type: '<?=$msgClass?>' };
