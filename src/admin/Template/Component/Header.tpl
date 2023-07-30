<div class="header">
    <a class="header-logo" href="<?= BASEURL ?>admin/">
        <span class="header-logo__icon"><?= svgIcon("header_logo", "logo-icon") ?></span>
        <span class="header-logo__title">Admin</span>
    </a>
    <button class="nav-toggle-btn"><?= svgIcon("menu", "nav-toggle-icon") ?></button>

    <div class="header__container">
        <div class="header__content main-header-content">
            <button id="userbtn" class="btn header-btn user-btn" type="button">
                <?= svgIcon("user", "btn__icon") ?>
                <span class="btn__content"><?= e($this->user_name) ?></span>
            </button>
        </div>

        <div class="header__content header-actions">
            <div class="header-title"></div>
        </div>
    </div>
</div>

<nav class="main-navigation navigation-content">
    <div class="navigation-controls">
        <button class="btn close-btn circle-btn"><?= svgIcon("back", "btn__icon") ?></button>
        <div class="navigation-logo">
            <a class="header-logo" href="<?= BASEURL ?>admin/">
                <span class="header-logo__icon"><?= svgIcon("header_logo", "logo-icon") ?></span>
                <span class="header-logo__title">Admin</span>
            </a>
        </div>
    </div>

    <ul class="nav-list">
        <li><a class="nav-item__link" href="<?= BASEURL ?>admin/currency/">Currencies</a></li>
        <li><a class="nav-item__link" href="<?= BASEURL ?>admin/icon/">Icons</a></li>
        <li><a class="nav-item__link" href="<?= BASEURL ?>admin/query/">Queries</a></li>
        <li><a class="nav-item__link" href="<?= BASEURL ?>admin/log/">Logs</a></li>
        <li><a class="nav-item__link" href="<?= BASEURL ?>admin/balance/">Balance</a></li>
        <li><a class="nav-item__link" href="<?= BASEURL ?>admin/tests/">Tests</a></li>
        <li><a class="nav-item__link" href="<?= BASEURL ?>admin/apiconsole/">API console</a></li>
        <li><a class="nav-item__link" href="<?= BASEURL ?>admin/user/">Users</a></li>
    </ul>
</nav>

<div class="user-navigation-content" hidden>
    <div class="user-navigation-controls">
        <div class="btn header-btn user-btn">
            <?= svgIcon("user", "btn__icon") ?>
            <span class="btn__content"><?= e($this->user_name) ?></span>
        </div>
        <button class="btn close-btn circle-btn right-align" tabindex="3"><?= svgIcon("close", "btn__icon") ?></button>
    </div>

    <?php if ($this->user_id != 0) {        ?>
        <ul class="nav-list">
            <li class="nav-item">
                <div class="theme-switch">
                    <span class="nav-item__title">Dark theme</span>
                    <label id="theme-check" class="switch">
                        <input type="checkbox" tabindex="4" <?= checked($this->userTheme == DARK_THEME) ?>>
                        <div class="switch-slider"></div>
                    </label>
                </div>
            </li>
            <li class="nav-separator"></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>profile/" tabindex="5">Profile</a></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>logout/" tabindex="6">Logout</a></li>
            <li class="nav-separator"></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>" tabindex="7">Back</a></li>
        </ul>
    <?php    }        ?>
</div>