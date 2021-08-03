<div <?=$attributes?> class="tile">
<?php   if ($type == "link") { ?>
    <a class="tilelink" href="<?=e($link)?>">
<?php   } else if ($type == "button") { ?>
    <button class="tilelink" type="button">
<?php   } else { ?>
    <div class="tilelink">
<?php   } ?>
        <span>
<?php   if (isset($subtitle)) { ?>
            <span class="tile__subtitle"><?=e($subtitle)?></span>
<?php   }
        if (isset($icon)) { ?>
            <span class="tile__icon"><?=useIcon($icon, 60, 54)?></span>
<?php   } ?>
            <span class="tile__title"><?=e($title)?></span>
        </span>
<?php   if ($type == "link") { ?>
    </a>
<?php   } else if ($type == "button") { ?>
    </button>
<?php   } else { ?>
    </div>
<?php   } ?>
</div>
