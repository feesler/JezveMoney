<div class="paginator">
<?php   foreach($pagesArr as $item) {
            if (isset($item["ellipsis"]) && $item["ellipsis"]) {   ?>
    <span class="paginator-item">...</span>
<?php	    } else if ($item["active"]) {   ?>
    <span class="paginator-item paginator-item__active" data-page="<?=e($item["page"])?>"><?=e($item["page"])?></span>
<?php	    } else {    ?>
    <a href="<?=e($item["link"])?>" class="paginator-item" data-page="<?=e($item["page"])?>"><?=e($item["page"])?></a>
<?php       }
    }	?>
</div>
