<div class="paginator">
<?php   foreach($pagesArr as $pageItem) {
        if (!is_numeric($pageItem["text"])) {   ?>
    <span><?=e($pageItem["text"])?></span>
<?php			} else if ($pageItem["active"]) {   ?>
    <span><b><?=e($pageItem["text"])?></b></span>
<?php			} else {    ?>
    <span><a href="<?=e($pageItem["link"])?>"><?=e($pageItem["text"])?></a></span>
<?php           }
    }	?>
</div>
