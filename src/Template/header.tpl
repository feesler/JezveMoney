<div class="header">
    <div class="header__content">
        <div class="header-logo">
            <a class="header-logo__link" href="<?=BASEURL?>">
                <span class="header-logo__icon"><?=svgIcon("header_logo", "logo-icon")?></span>
                <span class="header-logo__title">Jezve Money</span>
            </a>
        </div>
        <button class="nav-toggle-btn"><?=svgIcon("menu", "nav-toggle-icon")?></button>

        <div class="theme-switch">
            <label id="theme-check" class="switch">
<?php	if ($this->userTheme == DARK_THEME) {	?>
                <input type="checkbox" checked>
<?php	} else {	?>
                <input type="checkbox">
<?php	}	?>
                <div class="switch-slider"></div>
            </label>
        </div>
<?php	if ($this->user_id != 0) {		?>
        <div class="user-block">
            <button id="userbtn" class="user-menu-btn" type="button">
                <span class="user__icon"><?=svgIcon("user", "user-icon")?></span>
                <span class="user__title"><?=e($this->user_name)?></span>
            </button>
            <div id="menupopup" class="user-menu" hidden>
                <ul>
<?php	if ($this->adminUser) {		?>
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

<nav class="navigation-content">
    <div class="navigation-controls">
        <button class="navigation__close-btn">
            <?=svgIcon("back", "navigation__close-btn-icon")?>
        </button>
        <div class="navigation-logo">
            <a class="logo__link" href="<?=BASEURL?>">
                <span class="logo__icon"><?=svgIcon("header_logo")?></span>
                <span class="logo__title">Jezve Money</span>
            </a>
        </div>
    </div>

    <ul class="nav-list">
<?php	if ($this->user_id != 0) {		?>
        <a class="nav-link" href="<?=BASEURL?>accounts/">Accounts</a>
        <a class="nav-link" href="<?=BASEURL?>persons/">Persons</a>
        <a class="nav-link" href="<?=BASEURL?>transactions/">Transactions</a>
        <a class="nav-link" href="<?=BASEURL?>statistics/">Statistics</a>
        <a class="nav-link" href="<?=BASEURL?>import/">Import</a>
        <div class="nav-separator"></div>
<?php	}		?>
        <a class="nav-link nav-bottom-link" href="<?=BASEURL?>about/">About</a>
    </ul>
</nav>

