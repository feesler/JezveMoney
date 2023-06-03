<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap column-container">
                    <header class="heading">
                        <h1><?= __("PROFILE") ?></h1>
                    </header>

                    <main>
                        <section class="profile-block">
                            <h2><?= __("PROFILE_LOGIN") ?></h2>
                            <span><?= e($user_login) ?></span>
                        </section>

                        <section class="profile-block">
                            <h2><?= __("PROFILE_NAME") ?></h2>
                            <div class="name-container">
                                <span id="userNameTitle"><?= e($profileInfo["name"]) ?></span>
                                <a id="changeNameBtn" class="change-name-link" href="<?= BASEURL ?>profile/name/" data-action="name"><?= __("CHANGE") ?></a>
                            </div>
                        </section>

                        <section class="profile-block">
                            <h2><?= __("PROFILE_SECURITY") ?></h2>
                            <div><a id="changePassBtn" href="<?= BASEURL ?>profile/password/" data-action="password"><?= __("PROFILE_CHANGE_PASS") ?></a></div>
                        </section>

                        <section class="profile-block">
                            <h2><?= __("PROFILE_USER_DATA") ?></h2>
                            <div class="profile-block__section">
                                <span><?= __("PROFILE_USER_DATA_DESCR") ?></span>
                                <a id="resetBtn" href="<?= BASEURL ?>profile/reset/" data-action="reset"><?= __("PROFILE_RESET_DATA") ?></a>
                            </div>
                            <div class="profile-block__section">
                                <span><?= __("PROFILE_DELETE_DESCR") ?></span>
                                <input id="delProfileBtn" class="btn warning-btn" type="button" value="<?= __("PROFILE_DELETE") ?>">
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="changename" class="profile-form-container" hidden>
    <form method="post" action="<?= BASEURL ?>profile/changename/">
        <div id="name-inp-block" class="field form-row validation-block">
            <label for="newname" class="field__title"><?= __("PROFILE_NAME_NEW") ?></label>
            <input id="newname" class="input stretch-input" name="name" type="text" autocomplete="off" value="<?= e($profileInfo["name"]) ?>">
            <div class="feedback invalid-feedback"><?= __("PROFILE_INVALID_NAME") ?></div>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="<?= __("SUBMIT") ?>">
        </div>
    </form>
</div>

<div id="changepass" class="profile-form-container" hidden>
    <form method="post" action="<?= BASEURL ?>profile/changepass/">
        <div id="old-pwd-inp-block" class="field form-row validation-block">
            <label for="oldpwd" class="field__title"><?= __("PROFILE_PASSWORD_CURRENT") ?></label>
            <input id="oldpwd" class="input stretch-input" name="current" type="password" autocomplete="off">
            <div class="feedback invalid-feedback"><?= __("PROFILE_INVALID_PASS_CURRENT") ?></div>
        </div>

        <div id="new-pwd-inp-block" class="field form-row validation-block">
            <label for="newpwd" class="field__title"><?= __("PROFILE_PASSWORD_NEW") ?></label>
            <input id="newpwd" class="input stretch-input" name="new" type="password" autocomplete="off">
            <div class="feedback invalid-feedback"><?= __("PROFILE_INVALID_PASS_NEW") ?></div>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="<?= __("SUBMIT") ?>">
        </div>
    </form>
</div>

<div id="reset" class="profile-form-container" hidden>
    <form method="post" action="<?= BASEURL ?>profile/reset/">
        <div class="column-container">
            <label id="resetAllCheck" class="checkbox">
                <input type="checkbox">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("RESET_ALL") ?></span>
            </label>

            <label id="accountsCheck" class="checkbox">
                <input type="checkbox" name="accounts">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("RESET_ACCOUNTS") ?></span>
            </label>

            <label id="personsCheck" class="checkbox">
                <input type="checkbox" name="persons">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("RESET_PERSONS") ?></span>
            </label>

            <label id="categoriesCheck" class="checkbox">
                <input type="checkbox" name="categories">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("RESET_CATEGORIES") ?></span>
            </label>

            <label id="transactionsCheck" class="checkbox">
                <input type="checkbox" name="transactions">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("RESET_TRANSACTIONS") ?></span>
            </label>

            <label id="keepBalanceCheck" class="checkbox suboption" disabled>
                <input type="checkbox" name="keepbalance">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("RESET_KEEP_BALANCE") ?></span>
            </label>

            <label id="scheduleCheck" class="checkbox">
                <input type="checkbox" name="schedule">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("RESET_SCHEDULE") ?></span>
            </label>

            <label id="importTplCheck" class="checkbox">
                <input type="checkbox" name="importtpl">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("RESET_IMPORT_TEMPLATES") ?></span>
            </label>

            <label id="importRulesCheck" class="checkbox">
                <input type="checkbox" name="importrules">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("RESET_IMPORT_RULES") ?></span>
            </label>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="<?= __("SUBMIT") ?>">
        </div>
    </form>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>