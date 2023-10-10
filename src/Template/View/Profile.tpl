<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
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
    </form>
</div>

<div id="changepass" class="profile-form-container" hidden>
    <form method="post" action="<?= BASEURL ?>profile/changepass/">
    </form>
</div>

<div id="reset" class="profile-form-container" hidden>
    <form method="post" action="<?= BASEURL ?>profile/reset/"></form>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>