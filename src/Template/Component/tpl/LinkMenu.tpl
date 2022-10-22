<div <?= $attributes ?>>
<?php	foreach($items as $item) {	    ?>
<?php		if ($item["selected"]) {		?>
    <b class="link-menu-item link-menu-item_active" data-value="<?= e($item["value"]) ?>">
<?php		} else {	?>
    <a class="link-menu-item" href="<?=e($item["url"])?>" data-value="<?= e($item["value"]) ?>">
<?php		}	?>
<?php		if (isset($item["icon"])) {		?>
        <span class="link-menu-item__icon"><?= useIcon($item["icon"], "icon") ?></span>
<?php		}	?>
        <span class="link-menu-item__title"><?= e($item["title"]) ?></span>
<?php		if ($item["selected"]) {		?>
    </b>
<?php		} else {	?>
    </a>
<?php		}	?>
<?php	}	?>
</div>