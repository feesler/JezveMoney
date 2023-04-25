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
                    <?= svgIcon("user", "btn__icon") ?>
                    <span class="btn__content"><?= e($this->user_name) ?></span>
                <?php    } else {        ?>
                    <?= svgIcon("ellipsis", "btn__icon") ?>
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
        <button class="btn close-btn"><?= svgIcon("back", "btn__icon") ?></button>
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
                <a class="btn nav-item__icon-btn" href="<?= BASEURL ?>accounts/create/">
                    <?= useIcon("plus-light", "btn__icon") ?>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-item__link" href="<?= BASEURL ?>persons/"><?= __("PERSONS") ?></a>
                <a class="btn nav-item__icon-btn" href="<?= BASEURL ?>persons/create/">
                    <?= useIcon("plus-light", "btn__icon") ?>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-item__link" href="<?= BASEURL ?>categories/"><?= __("CATEGORIES") ?></a>
                <a class="btn nav-item__icon-btn" href="<?= BASEURL ?>categories/create/">
                    <?= useIcon("plus-light", "btn__icon") ?>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-item__link" href="<?= BASEURL ?>transactions/"><?= __("TRANSACTIONS") ?></a>
                <a class="btn nav-item__icon-btn" href="<?= BASEURL ?>transactions/create/">
                    <?= useIcon("plus-light", "btn__icon") ?>
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
                <?= svgIcon("user", "btn__icon") ?>
                <span class="btn__content"><?= e($this->user_name) ?></span>
            </div>
        <?php    }    ?>
        <button class="btn close-btn right-align" tabindex="3"><?= svgIcon("close", "btn__icon") ?></button>
    </div>

    <?php if ($this->user_id != 0) {        ?>
        <ul class="nav-list">
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>profile/" tabindex="4"><?= __("PROFILE") ?></a></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>settings/" tabindex="5"><?= __("SETTINGS") ?></a></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>logout/" tabindex="6"><?= __("LOGOUT") ?></a></li>
            <?php if ($this->adminUser) {        ?>
                <li class="nav-separator"></li>
                <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>admin/" tabindex="7"><?= __("ADMIN_PANEL") ?></a></li>
            <?php        }        ?>
        </ul>
    <?php    }        ?>
</nav>