<?php

use JezveMoney\App\Template\Component\TileInfoItem;
?>
<div id="<?= ($id) ?>" class="field account-container" <?= hidden($hidden) ?>>
    <input id="<?= ($inputId) ?>" name="<?= ($inputId) ?>" type="hidden" value="<?= ($inputValue) ?>">
    <label class="field__title">
        <span><?= ($title) ?></span>
        <?php if (!is_null($closeButton)) {     ?>
            <button class="btn close-btn" type="button" <?= hidden($closeButton) ?>>
                <?= svgIcon("close", "btn__icon") ?>
            </button>
        <?php   }   ?>
    </label>
    <div class="tile-base" <?= hidden($baseHidden) ?>>
        <div class="tile-info-block">
            <?php foreach ($infoItems as $item) {    ?>
                <?= TileInfoItem::render($item) ?>
            <?php    }    ?>
        </div>
    </div>
    <?php if (!is_null($accountToggler)) {     ?>
        <div class="account-toggler" <?= hidden($accountToggler) ?>>
            <button class="btn dashed-btn" type="button"><?= __("ACCOUNT_SELECT") ?></button>
        </div>
    <?php    }    ?>
    <?php if (!is_null($noAccountsMsg)) {     ?>
        <span class="nodata-message" <?= hidden($noAccountsMsgHidden) ?>><?= e($noAccountsMsg) ?></span>
    <?php    }    ?>
</div>