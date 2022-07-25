<div class="header">
    <div class="header__content">
        <div class="logo">
            <a class="logo__link" href="<?=BASEURL?>admin/">
                <span class="logo__icon"><?=svgIcon("header_logo")?></span>
                <span class="logo__title">Admin</span>
            </a>
        </div>
        <button class="nav-toggle-btn"><?=svgIcon("menu")?></button>

        <div class="user-block right-align">
            <button id="userbtn" class="user-menu-btn" type="button">
                <span class="user__icon"><?=svgIcon("user")?></span>
                <span class="user__title"><?=e($this->user_name)?></span>
            </button>
            <div id="menupopup" class="user-menu" hidden>
                <ul>
                    <li><a href="<?=BASEURL?>">Index</a></li>
                    <li class="separator"></li>
<?php	foreach($this->menuItems as $item_id => $m_item) {	?>
<?php		if (isset($m_item["active"]) && $m_item["active"]) {		?>
                    <li><b><?=e($m_item["title"])?></b></li>
<?php		} else {		?>
                    <li><a href="<?=BASEURL?>admin/<?=e($m_item["link"])?>"><?=e($m_item["title"])?></a></li>
<?php		}		?>
<?php	}	?>
                </ul>
            </div>
        </div>
    </div>
</div>
