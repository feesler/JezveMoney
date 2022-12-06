<div class="header">
    <div class="header__content">
        <a class="header-logo" href="<?= BASEURL ?>" tabindex="1">
            <span class="header-logo__icon"><?= svgIcon("header_logo", "logo-icon") ?></span>
            <span class="header-logo__title">Jezve Money</span>
        </a>
        <button class="nav-toggle-btn"><?= svgIcon("menu", "nav-toggle-icon") ?></button>
        <div class="header-title"></div>

        <button id="userbtn" class="btn user-btn" type="button" tabindex="2">
            <?php if ($this->user_id != 0) {        ?>
                <span class="user-btn__icon"><?= svgIcon("user", "user-icon") ?></span>
                <span class="user-btn__title"><?= e($this->user_name) ?></span>
            <?php    } else {        ?>
                <span class="user-btn__icon"><?= svgIcon("ellipsis", "user-icon") ?></span>
            <?php    }        ?>
        </button>
    </div>
</div>

<nav class="navigation-content">
    <div class="navigation-controls">
        <button class="navigation__close-btn">
            <?= svgIcon("back", "navigation__close-btn-icon") ?>
        </button>
        <div class="navigation-logo">
            <a class="header-logo" href="<?= BASEURL ?>">
                <span class="header-logo__icon"><?= svgIcon("header_logo", "logo-icon") ?></span>
                <span class="header-logo__title">Jezve Money</span>
            </a>
        </div>
    </div>

    <ul class="nav-list">
        <?php if ($this->user_id != 0) {        ?>
            <li class="nav-item">
                <a class="nav-item__link" href="<?= BASEURL ?>accounts/">Accounts</a>
                <a class="nav-item__icon-btn" href="<?= BASEURL ?>accounts/create/">
                    <?= useIcon("plus-light", "nav-item__icon") ?>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-item__link" href="<?= BASEURL ?>persons/">Persons</a>
                <a class="nav-item__icon-btn" href="<?= BASEURL ?>persons/create/">
                    <?= useIcon("plus-light", "nav-item__icon") ?>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-item__link" href="<?= BASEURL ?>transactions/">Transactions</a>
                <a class="nav-item__icon-btn" href="<?= BASEURL ?>transactions/create/">
                    <?= useIcon("plus-light", "nav-item__icon") ?>
                </a>
            </li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>statistics/">Statistics</a></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>import/">Import</a></li>
            <li class="nav-separator"></li>
        <?php    }        ?>
        <li class="nav-bottom"><a class="nav-item__link" href="<?= BASEURL ?>about/">About</a></li>
    </ul>
</nav>

<div class="user-navigation-content" hidden>
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
                <div class="theme-switch">
                    <span class="theme-switch__label">Dark theme</span>
                    <label id="theme-check" class="switch">
                        <input type="checkbox" tabindex="4" <?= checked($this->userTheme == DARK_THEME) ?>>
                        <div class="switch-slider"></div>
                    </label>
                </div>
            </li>
            <li class="nav-separator"></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>profile/" tabindex="5">Profile</a></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>logout/" tabindex="6">Logout</a></li>
            <?php if ($this->adminUser) {        ?>
                <li class="nav-separator"></li>

                <li class="nav-bottom"><a class="nav-item__link" href="<?= BASEURL ?>admin/" tabindex="7">Admin panel</a></li>
            <?php        }        ?>
        </ul>
    <?php    }        ?>
</div>