<?php if ($type == "link") { ?>
    <a <?= $attributes ?>>
    <?php   } else { ?>
        <button <?= $attributes ?>>
        <?php   } ?>
        <?= svgIcon($icon, "btn__icon") ?>
        <?php if (isset($title) && !is_empty($title)) { ?>
            <span class="btn__content">
                <?php if (isset($subtitle) && !is_empty($subtitle)) { ?>
                    <span class="btn__title"><?= e($title) ?></span>
                    <span class="btn__subtitle"><?= e($subtitle) ?></span>
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