<div class="header">
    <div class="header__content">
        <a class="header-logo" href="<?=BASEURL?>admin/">
            <span class="header-logo__icon"><?=svgIcon("header_logo", "logo-icon")?></span>
            <span class="header-logo__title">Admin</span>
        </a>
        <button class="nav-toggle-btn"><?=svgIcon("menu", "nav-toggle-icon")?></button>

        <button id="userbtn" class="user-btn" type="button">
            <span class="user-btn__icon"><?=svgIcon("user", "user-icon")?></span>
            <span class="user-btn__title"><?=e($this->user_name)?></span>
        </button>
    </div>
</div>

<div class="user-navigation-content">
    <div class="user-navigation-controls">
        <div class="user-btn">
            <span class="user-btn__icon"><?=svgIcon("user", "user-icon")?></span>
            <span class="user-btn__title"><?=e($this->user_name)?></span>
        </div>
        <button class="user-navigation__close-btn">
            <?=svgIcon("close", "user-navigation__close-btn-icon")?>
        </button>
    </div>

    <ul class="nav-list">
        <li><a class="nav-item__link" href="<?=BASEURL?>">Index</a></li>
        <li class="nav-separator"></li>
        <li><a class="nav-item__link" href="<?=BASEURL?>admin/dbinstall/">DB update</a></li>
        <li><a class="nav-item__link" href="<?=BASEURL?>admin/currency/">Currencies</a></li>
        <li><a class="nav-item__link" href="<?=BASEURL?>admin/icon/">Icons</a></li>
        <li><a class="nav-item__link" href="<?=BASEURL?>admin/query/">Queries</a></li>
        <li><a class="nav-item__link" href="<?=BASEURL?>admin/log/">Logs</a></li>
        <li><a class="nav-item__link" href="<?=BASEURL?>admin/balance/">Balance</a></li>
        <li><a class="nav-item__link" href="<?=BASEURL?>admin/tests/">Tests</a></li>
        <li><a class="nav-item__link" href="<?=BASEURL?>admin/apiconsole/">API console</a></li>
        <li><a class="nav-item__link" href="<?=BASEURL?>admin/user/">Users</a></li>
    </ul>
</div>