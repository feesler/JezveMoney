<?php if ($type == "link") { ?>
    <a <?= $attributes ?>>
    <?php   } else { ?>
        <button <?= $attributes ?>>
        <?php   } ?>
        <span class="iconbutton__icon"><?= svgIcon($icon, "iconbutton__icon-content") ?></span>
        <?php if (isset($title) && !is_empty($title)) { ?>
            <span class="iconbutton__content">
                <?php if (isset($subtitle) && !is_empty($subtitle)) { ?>
                    <span class="iconbutton__title"><?= e($title) ?></span>
                    <span class="iconbutton__subtitle"><?= e($subtitle) ?></span>
                <?php   } else { ?>
                    <span><?= e($title) ?></span>
                <?php   } ?>
            </span>
        <?php   } ?>
        <?php if ($type == "link") { ?>
    </a>
<?php   } else { ?>
    </button>
<?php   } ?>