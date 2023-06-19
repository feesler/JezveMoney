<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap column-container">
                    <header class="heading">
                        <h1><?= __("profile.title") ?></h1>
                    </header>

                    <main>
                        <section class="profile-block">
                            <h2><?= __("profile.login") ?></h2>
                            <span><?= e($user_login) ?></span>
                        </section>

                        <section class="profile-block">
                            <h2><?= __("profile.name") ?></h2>
                            <div class="name-container">
                                <span id="userNameTitle"><?= e($profileInfo["name"]) ?></span>
                                <a id="changeNameBtn" class="change-name-link" href="<?= BASEURL ?>profile/name/" data-action="name"><?= __("actions.update") ?></a>
                            </div>
                        </section>

                        <section class="profile-block">
                            <h2><?= __("profile.security") ?></h2>
                            <div><a id="changePassBtn" href="<?= BASEURL ?>profile/password/" data-action="password"><?= __("profile.changePassword") ?></a></div>
                        </section>

                        <section class="profile-block">
                            <h2><?= __("profile.userData") ?></h2>
                            <div class="profile-block__section">
                                <span><?= __("profile.userDataDescription") ?></span>
                                <a id="resetBtn" href="<?= BASEURL ?>profile/reset/" data-action="reset"><?= __("profile.resetData") ?></a>
                            </div>
                            <div class="profile-block__section">
                                <span><?= __("profile.deleteDescription") ?></span>
                                <input id="delProfileBtn" class="btn warning-btn" type="button" value="<?= __("profile.delete") ?>">
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
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="<?= __("actions.submit") ?>">
        </div>
    </form>
</div>

<div id="changepass" class="profile-form-container" hidden>
    <form method="post" action="<?= BASEURL ?>profile/changepass/">
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="<?= __("actions.submit") ?>">
        </div>
    </form>
</div>

<div id="reset" class="profile-form-container" hidden>
    <form method="post" action="<?= BASEURL ?>profile/reset/">
        <div class="column-container">
            <label id="resetAllCheck" class="checkbox">
                <input type="checkbox">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("profile.reset.all") ?></span>
            </label>

            <label id="accountsCheck" class="checkbox">
                <input type="checkbox" name="accounts">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("profile.reset.accounts") ?></span>
            </label>

            <label id="personsCheck" class="checkbox">
                <input type="checkbox" name="persons">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("profile.reset.persons") ?></span>
            </label>

            <label id="categoriesCheck" class="checkbox">
                <input type="checkbox" name="categories">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("profile.reset.categories") ?></span>
            </label>

            <label id="transactionsCheck" class="checkbox">
                <input type="checkbox" name="transactions">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("profile.reset.transactions") ?></span>
            </label>

            <label id="keepBalanceCheck" class="checkbox suboption" disabled>
                <input type="checkbox" name="keepbalance">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("profile.reset.keepBalance") ?></span>
            </label>

            <label id="scheduleCheck" class="checkbox">
                <input type="checkbox" name="schedule">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("profile.reset.schedule") ?></span>
            </label>

            <label id="importTplCheck" class="checkbox">
                <input type="checkbox" name="importtpl">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("profile.reset.importTemplates") ?></span>
            </label>

            <label id="importRulesCheck" class="checkbox">
                <input type="checkbox" name="importrules">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("profile.reset.importRules") ?></span>
            </label>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="<?= __("actions.submit") ?>">
        </div>
    </form>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>