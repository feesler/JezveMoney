<?php if ($type == "link") { ?>
    <a <?= $attributes ?>>
    <?php   } else { ?>
        <button <?= $attributes ?>>
        <?php   } ?>
        <?= svgIcon($icon, "btn__icon") ?>
        <?php if (isset($title) && !is_empty($title)) { ?>
            <?php if (isset($icon) && !is_empty($icon)) { ?>
                <span class="btn__content"><?= e($title) ?></span>
            <?php   } else { ?>
                <?= e($title) ?>
            <?php   } ?>
        <?php   } ?>
        <?php if ($type == "link") { ?>
    </a>
<?php   } else { ?>
    </button>
<?php   } ?>