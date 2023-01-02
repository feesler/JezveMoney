<header class="header">
    <a class="header-logo" href="<?= BASEURL ?>" tabindex="1">
        <span class="header-logo__icon"><?= svgIcon("header_logo", "logo-icon") ?></span>
        <span class="header-logo__title"><?= __("APP_NAME") ?></span>
    </a>
    <button class="nav-toggle-btn"><?= svgIcon("menu", "nav-toggle-icon") ?></button>

    <div class="header__container">
        <div class="header__content">
            <button id="userbtn" class="btn user-btn right-align" type="button" tabindex="2">
                <?php if ($this->user_id != 0) {        ?>
                    <span class="user-btn__icon"><?= svgIcon("user", "user-icon") ?></span>
                    <span class="user-btn__title"><?= e($this->user_name) ?></span>
                <?php    } else {        ?>
                    <span class="user-btn__icon"><?= svgIcon("ellipsis", "user-icon") ?></span>
                <?php    }        ?>
            </button>
        </div>

        <div class="header__content header-actions">
            <div class="header-title"></div>
        </div>
    </div>
</header>

<nav class="main-navigation navigation-content">
    <div class="navigation-controls">
        <button class="navigation__close-btn">
            <?= svgIcon("back", "navigation__close-btn-icon") ?>
        </button>
        <div class="navigation-logo">
            <a class="header-logo" href="<?= BASEURL ?>">
                <span class="header-logo__icon"><?= svgIcon("header_logo", "logo-icon") ?></span>
                <span class="header-logo__title"><?= __("APP_NAME") ?></span>
            </a>
        </div>
    </div>

    <ul class="nav-list">
        <?php if ($this->user_id != 0) {        ?>
            <li class="nav-item">
                <a class="nav-item__link" href="<?= BASEURL ?>accounts/"><?= __("ACCOUNTS") ?></a>
                <a class="nav-item__icon-btn" href="<?= BASEURL ?>accounts/create/">
                    <?= useIcon("plus-light", "nav-item__icon") ?>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-item__link" href="<?= BASEURL ?>persons/"><?= __("PERSONS") ?></a>
                <a class="nav-item__icon-btn" href="<?= BASEURL ?>persons/create/">
                    <?= useIcon("plus-light", "nav-item__icon") ?>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-item__link" href="<?= BASEURL ?>categories/"><?= __("CATEGORIES") ?></a>
                <a class="nav-item__icon-btn" href="<?= BASEURL ?>categories/create/">
                    <?= useIcon("plus-light", "nav-item__icon") ?>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-item__link" href="<?= BASEURL ?>transactions/"><?= __("TRANSACTIONS") ?></a>
                <a class="nav-item__icon-btn" href="<?= BASEURL ?>transactions/create/">
                    <?= useIcon("plus-light", "nav-item__icon") ?>
                </a>
            </li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>statistics/"><?= __("STATISTICS") ?></a></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>import/"><?= __("IMPORT") ?></a></li>
            <li class="nav-separator"></li>
        <?php    }        ?>
        <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>about/"><?= __("ABOUT") ?></a></li>
    </ul>
</nav>

<nav class="user-navigation-content" hidden>
    <div class="user-navigation-controls">
        <?php if ($this->user_id != 0) {        ?>
            <div class="btn user-btn">
                <span class="user-btn__icon"><?= svgIcon("user", "user-icon") ?></span>
                <span class="user-btn__title"><?= e($this->user_name) ?></span>
            </div>
        <?php    }    ?>
        <button class="btn user-navigation__close-btn" tabindex="3">
            <?= svgIcon("close", "user-navigation__close-btn-icon") ?>
        </button>
    </div>

    <?php if ($this->user_id != 0) {        ?>
        <ul class="nav-list">
            <li class="nav-item">
                <select id="localeSelect"></select>
            </li>
            <li class="nav-item">
                <div class="theme-switch">
                    <span class="theme-switch__label"><?= __("DARK_THEME") ?></span>
                    <label id="theme-check" class="switch">
                        <input type="checkbox" tabindex="4" <?= checked($this->userTheme == DARK_THEME) ?>>
                        <div class="switch-slider"></div>
                    </label>
                </div>
            </li>
            <li class="nav-separator"></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>profile/" tabindex="5"><?= __("PROFILE") ?></a></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>logout/" tabindex="6"><?= __("LOGOUT") ?></a></li>
            <?php if ($this->adminUser) {        ?>
                <li class="nav-separator"></li>
                <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>admin/" tabindex="7"><?= __("ADMIN_PANEL") ?></a></li>
            <?php        }        ?>
        </ul>
    <?php    }        ?>
</nav>