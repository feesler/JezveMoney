<nav class="main-navigation navigation-content">
    <div class="navigation-controls">
        <button class="btn close-btn circle-btn"><?= useIcon("back", "btn__icon") ?></button>
        <div class="navigation-logo">
            <a class="header-logo" href="<?= BASEURL ?>">
                <span class="header-logo__icon"><?= useIcon("header-logo", "logo-icon") ?></span>
                <span class="header-logo__title"><?= __("appName") ?></span>
            </a>
        </div>
    </div>
</nav>

<nav class="user-navigation-content" hidden>
    <div class="user-navigation-controls">
        <?php if ($this->user_id != 0) {        ?>
            <div class="btn header-btn user-btn">
                <?= useIcon("user", "btn__icon") ?>
                <span class="btn__content"><?= e($this->user_name) ?></span>
            </div>
        <?php    }    ?>
        <button class="btn close-btn circle-btn right-align" tabindex="3"><?= useIcon("close", "btn__icon") ?></button>
    </div>

    <?php if ($this->user_id != 0) {        ?>
        <ul class="nav-list">
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>profile/" tabindex="4"><?= __("profile.title") ?></a></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>settings/" tabindex="5"><?= __("settings.title") ?></a></li>
            <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>logout/" tabindex="6"><?= __("actions.logout") ?></a></li>
            <?php if ($this->adminUser) {        ?>
                <li class="nav-separator"></li>
                <li class="nav-item"><a class="nav-item__link" href="<?= BASEURL ?>admin/" tabindex="7"><?= __("adminPanel") ?></a></li>
            <?php        }        ?>
        </ul>
    <?php    }        ?>
</nav>