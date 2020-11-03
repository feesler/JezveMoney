<div class="admin-header">
    <div class="menu"><span><a href="<?=BASEURL?>admin/">Admin</a></span><span><a href="<?=BASEURL?>">Index</a></span></div>
    <div class="menu">
<?php	foreach($this->menuItems as $item_id => $m_item) {	?>
<?php		if (isset($m_item["active"]) && $m_item["active"]) {		?>
        <span><b><?=e($m_item["title"])?></b></span>
<?php		} else {		?>
        <span><a href="<?=BASEURL?>admin/<?=e($m_item["link"])?>"><?=e($m_item["title"])?></a></span>
<?php		}		?>
<?php	}	?>
    </div>
</div>
