<?php   if (isset($hidden) && $hidden) {  ?>
<div id="<?=e($id)?>" class="hidden">
<?php   } else {    ?>
<div id="<?=e($id)?>">
<?php   }   ?>
    <span><?=e($title)?></span>
    <div>
        <button class="dashed-btn" type="button"><span><?=e($value)?></span></button>
    </div>
</div>
