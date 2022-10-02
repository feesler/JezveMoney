<div class="header">
    <div class="header__content">
        <a class="header-logo" href="<?=BASEURL?>">
            <span class="header-logo__icon"><?=svgIcon("header_logo", "logo-icon")?></span>
            <span class="header-logo__title">Jezve Money</span>
        </a>
        <button class="nav-toggle-btn"><?=svgIcon("menu", "nav-toggle-icon")?></button>

        <button id="userbtn" class="user-btn" type="button">
<?php	if ($this->user_id != 0) {		?>
            <span class="user-btn__icon"><?=svgIcon("user", "user-icon")?></span>
            <span class="user-btn__title"><?=e($this->user_name)?></span>
<?php	} else {		?>
            <span class="user-btn__icon"><?=svgIcon("ellipsis", "user-icon")?></span>
<?php	}		?>
        </button>
    </div>
</div>

<nav class="navigation-content">
    <div class="navigation-controls">
        <button class="navigation__close-btn">
            <?=svgIcon("back", "navigation__close-btn-icon")?>
        </button>
        <div class="navigation-logo">
            <a class="header-logo" href="<?=BASEURL?>">
                <span class="header-logo__icon"><?=svgIcon("header_logo", "logo-icon")?></span>
                <span class="header-logo__title">Jezve Money</span>
            </a>
        </div>
    </div>

    <ul class="nav-list">
<?php	if ($this->user_id != 0) {		?>
        <li><a class="nav-link" href="<?=BASEURL?>accounts/">Accounts</a></li>
        <li><a class="nav-link" href="<?=BASEURL?>persons/">Persons</a></li>
        <li><a class="nav-link" href="<?=BASEURL?>transactions/">Transactions</a></li>
        <li><a class="nav-link" href="<?=BASEURL?>statistics/">Statistics</a></li>
        <li><a class="nav-link" href="<?=BASEURL?>import/">Import</a></li>
        <li class="nav-separator"></li>
<?php	}		?>
        <li class="nav-bottom"><a class="nav-link" href="<?=BASEURL?>about/">About</a></li>
    </ul>
</nav>

<div class="user-navigation-content">
    <div class="user-navigation-controls">
<?php	if ($this->user_id != 0) {		?>
        <div class="user-btn">
            <span class="user-btn__icon"><?=svgIcon("user", "user-icon")?></span>
            <span class="user-btn__title"><?=e($this->user_name)?></span>
        </div>
<?php	}	?>
        <button class="user-navigation__close-btn">
            <?=svgIcon("close", "user-navigation__close-btn-icon")?>
        </button>
    </div>

    <div class="theme-switch">
        <span class="theme-switch__label">Dark theme</span>
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
    <ul class="nav-list">
        <li><a class="nav-link" href="<?=BASEURL?>profile/">Profile</a></li>
        <li><a class="nav-link" href="<?=BASEURL?>logout/">Logout</a></li>
<?php	    if ($this->adminUser) {		?>
        <li class="nav-separator"></li>
        <li class="nav-bottom"><a class="nav-link" href="<?=BASEURL?>admin/">Admin panel</a></li>
<?php	    }		?>
    </ul>
<?php	}		?>
</div>