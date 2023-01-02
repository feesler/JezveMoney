<?php

use JezveMoney\App\Template\Component\Tile;
use JezveMoney\App\Template\Component\TileInfoItem;
?>
<div id="<?= ($id) ?>" class="account-container" <?= hidden($hidden) ?>>
    <input id="<?= ($inputId) ?>" name="<?= ($inputId) ?>" type="hidden" value="<?= ($inputValue) ?>">
    <header class="tile_header">
        <label><?= ($title) ?></label>
        <?php if (!is_null($closeButton)) {     ?>
            <button class="close-btn" type="button" <?= hidden($closeButton) ?>>
                <?= svgIcon("close", "close-icon") ?>
            </button>
        <?php   }   ?>
    </header>
    <div class="tile-base" <?= hidden($baseHidden) ?>>
        <div class="tile_container">
            <?= Tile::render($tile) ?>
        </div>

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