		<div class="admin_header">
			<a href="./index.php">Admin</a><br>
<?php	foreach($menuItems as $item_id => $m_item) {	?>
<?php		if (isset($m_item["active"]) && $m_item["active"]) {		?>
			<b><?=$m_item["title"]?></b>
<?php		} else {		?>
			<a href="<?=$m_item["link"]?>"><?=$m_item["title"]?></a>
<?php		}		?>
<?php	}	?>
<?php	checkMessage();		?>
		</div>