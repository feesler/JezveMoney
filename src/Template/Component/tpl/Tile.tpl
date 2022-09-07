<?php   if ($type == "link") { ?>
    <a class="tile" href="<?=e($link)?>" <?=$attributes?>>
<?php   } else if ($type == "button") { ?>
    <button class="tile" type="button" <?=$attributes?>>
<?php   } else { ?>
    <div class="tile" <?=$attributes?>>
<?php   } ?>
<?php   if (isset($subtitle)) { ?>
        <span class="tile__subtitle"><?=$subtitle?></span>
<?php   }
        if (isset($icon)) { ?>
        <span class="tile__icon"><?=useIcon($icon, 60, 54)?></span>
<?php   } ?>
        <span class="tile__title"><?=e($title)?></span>
<?php   if ($type == "link") { ?>
    </a>
<?php   } else if ($type == "button") { ?>
    </button>
<?php   } else { ?>
    </div>
<?php   } ?>
