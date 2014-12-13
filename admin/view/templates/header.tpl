		<div class="admin_header">
			<div class="title"><a href="./index.php">Admin</a></div>
			<div class="menu">
<?php	foreach($menuItems as $item_id => $m_item) {	?>
<?php		if (isset($m_item["active"]) && $m_item["active"]) {		?>
				<span><b><?=$m_item["title"]?></b></span>
<?php		} else {		?>
				<span><a href="<?=$m_item["link"]?>"><?=$m_item["title"]?></a></span>
<?php		}		?>
<?php	}	?>
			</div>
<?php	checkMessage();		?>
		</div>