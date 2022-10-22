<div <?= $attributes ?>>
<?php	foreach($items as $item) {	    ?>
<?php		if ($multiple && isset($item["value"])) {		?>
    <label class="checkbox link-menu-item" data-value="<?= e($item["value"]) ?>">
        <input type="checkbox"<?= checked($item["selected"]) ?>>
        <span class="checkbox__check"><?= useIcon("check", "checkbox__icon") ?></span>
        <span class="checkbox__label">
            <a href="<?= e($item["url"]) ?>">
                <span class="link-menu-item__title"><?= e($item["title"]) ?></span>
            </a>
        </span>
    </label>
<?php		} else {	?>
<?php	    	if ($item["selected"] && !$multiple) {		?>
    <b class="link-menu-item link-menu-item_selected"<?= ($item["data-value"]) ?>>
<?php	    	} else {	?>
    <a class="link-menu-item" href="<?=e($item["url"])?>"<?= ($item["data-value"]) ?>>
<?php	    	}	?>
<?php	    	if (isset($item["icon"])) {		?>
        <span class="link-menu-item__icon"><?= useIcon($item["icon"], "icon") ?></span>
<?php	    	}	?>
        <span class="link-menu-item__title"><?= e($item["title"]) ?></span>
<?php		    if ($item["selected"] && !$multiple) {		?>
    </b>
<?php		    } else {	?>
    </a>
<?php	    	}	?>
<?php		}	?>
<?php	}	?>
</div>