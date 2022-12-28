<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap column-container">
                    <header class="heading">
                        <h1>Profile</h1>
                    </header>

                    <main>
                        <section class="profile-block">
                            <h2>Login</h2>
                            <span><?= e($user_login) ?></span>
                        </section>

                        <section class="profile-block">
                            <h2>Name</h2>
                            <div class="name-container">
                                <span id="userNameTitle"><?= e($profileInfo["name"]) ?></span>
                                <a id="changeNameBtn" class="change-name-link" href="<?= BASEURL ?>profile/name/" data-action="name">Change</a>
                            </div>
                        </section>

                        <section class="profile-block">
                            <h2>Security</h2>
                            <div><a id="changePassBtn" href="<?= BASEURL ?>profile/password/" data-action="password">Change password</a></div>
                        </section>

                        <section class="profile-block">
                            <h2>User data</h2>
                            <div class="profile-block__section">
                                <span>You also may reset your data.</span>
                                <a id="resetBtn" href="<?= BASEURL ?>profile/reset/" data-action="reset">Reset data</a>
                            </div>
                            <div class="profile-block__section">
                                <span>Completely delete profile and all related data.</span>
                                <input id="delProfileBtn" class="btn submit-btn warning-btn" type="button" value="Delete profile">
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
        <div id="name-inp-block" class="validation-block view-row std_margin">
            <label for="newname">New name</label>
            <input id="newname" class="stretch-input" name="name" type="text" autocomplete="off" value="<?= e($profileInfo["name"]) ?>">
            <div class="invalid-feedback">Input name.<br>New name must be different from the old.</div>
        </div>

        <div class="popup__controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="changepass" class="profile-form-container" hidden>
    <form method="post" action="<?= BASEURL ?>profile/changepass/">
        <div id="old-pwd-inp-block" class="validation-block view-row std_margin">
            <label for="oldpwd">Current password</label>
            <input id="oldpwd" class="stretch-input" name="current" type="password" autocomplete="off">
            <div class="invalid-feedback">Input current password.</div>
        </div>

        <div id="new-pwd-inp-block" class="validation-block view-row std_margin">
            <label for="newpwd">New password</label>
            <input id="newpwd" class="stretch-input" name="new" type="password" autocomplete="off">
            <div class="invalid-feedback">Input new password.<br>New password must be different from the old.</div>
        </div>

        <div class="popup__controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="reset" class="profile-form-container" hidden>
    <form method="post" action="<?= BASEURL ?>profile/reset/">
        <div class="view-row column-container">
            <label id="resetAllCheck" class="checkbox">
                <input type="checkbox">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">All</span>
            </label>

            <label id="accountsCheck" class="checkbox">
                <input type="checkbox" name="accounts">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Accounts</span>
            </label>

            <label id="personsCheck" class="checkbox">
                <input type="checkbox" name="persons">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Persons</span>
            </label>

            <label id="categoriesCheck" class="checkbox">
                <input type="checkbox" name="categories">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Categories</span>
            </label>

            <label id="transactionsCheck" class="checkbox">
                <input type="checkbox" name="transactions">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Transactions</span>
            </label>

            <label id="keepBalanceCheck" class="checkbox suboption" disabled>
                <input type="checkbox" name="keepbalance">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Keep current balance of accounts</span>
            </label>

            <label id="importTplCheck" class="checkbox">
                <input type="checkbox" name="importtpl">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Import templates</span>
            </label>

            <label id="importRulesCheck" class="checkbox">
                <input type="checkbox" name="importrules">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Import rules</span>
            </label>
        </div>

        <div class="popup__controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>