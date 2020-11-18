<div class="header">
    <div class="header__content centered">
        <div class="logo">
            <a href="<?=BASEURL?>">
                <span class="logo__icon"><?=svgIcon("header_logo")?></span>
                <span class="logo__title">Jezve Money</span>
            </a>
        </div>
        <div class="iconlink right-align">
            <a href="<?=BASEURL?>import/">
                <span class="iconlink__icon"><?=svgIcon("import")?></span>
                <span class="iconlink__content"><span>Import</span></span>
            </a>
        </div>
        <div class="theme-switch">
            <label class="switch">
<?php	if ($this->userTheme == DARK_THEME) {	?>
                <input id="theme-check" type="checkbox" checked>
<?php	} else {	?>
                <input id="theme-check" type="checkbox">
<?php	}	?>
                <div class="switch-slider"></div>
            </label>
        </div>
<?php	if ($this->user_id != 0) {		?>
        <div class="user-block">
            <button id="userbtn" class="user-menu-btn" type="button">
                <span class="user__icon"><?=svgIcon("user")?></span>
                <span class="user__title"><?=e($this->user_name)?></span>
            </button>
            <div id="menupopup" class="user-menu hidden">
                <ul>
<?php	if ($this->uMod->isAdmin($this->user_id)) {		?>
                    <li><a href="<?=BASEURL?>admin/">admin panel</a></li>
                    <li class="separator"></li>
<?php	}		?>
                    <li><a href="<?=BASEURL?>profile/">profile</a></li>
                    <li><a href="<?=BASEURL?>logout/">logout</a></li>
                </ul>
            </div>
        </div>
<?php	}	?>
    </div>
</div>
