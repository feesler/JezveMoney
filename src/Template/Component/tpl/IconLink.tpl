<?php   if ($type == "link") { ?>
<a <?=$attributes?>>
<?php   } else { ?>
<button <?=$attributes?>>
<?php   } ?>
    <span class="iconlink__icon"><?=svgIcon($icon, "iconlink__icon-content")?></span>
    <span class="iconlink__content">
<?php   if (isset($subtitle) && !is_empty($subtitle)) { ?>
        <span class="iconlink__title"><?=e($title)?></span>
        <span class="iconlink__subtitle"><?=e($subtitle)?></span>
<?php   } else { ?>
        <span><?=e($title)?></span>
<?php   } ?>
    </span>
<?php   if ($type == "link") { ?>
</a>
<?php   } else { ?>
</button>
<?php   } ?>