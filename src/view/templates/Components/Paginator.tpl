<div class="paginator">
<?php   foreach($pagesArr as $pageItem) {
        if (!is_numeric($pageItem["text"])) {   ?>
    <span class="paginator-item"><?=e($pageItem["text"])?></span>
<?php			} else if ($pageItem["active"]) {   ?>
    <span class="paginator-item paginator-item__active"><?=e($pageItem["text"])?></span>
<?php			} else {    ?>
    <a href="<?=e($pageItem["link"])?>" class="paginator-item"><?=e($pageItem["text"])?></a>
<?php           }
    }	?>
</div>
