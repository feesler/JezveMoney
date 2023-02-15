<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <main class="form-container">
                        <div class="register-form">
                            <h1><?= __("REGISTRATION") ?></h1>
                            <form id="form" action="<?= BASEURL ?>register/" method="post">
                                <div id="login-inp-block" class="validation-block std_margin">
                                    <label for="loginInp"><?= __("REG_ACCOUNT_NAME") ?></label>
                                    <input id="loginInp" class="stretch-input" name="login" type="text" autocomplete="off">
                                    <div class="feedback invalid-feedback"><?= __("REG_INVALID_ACCOUNT_NAME") ?></div>
                                </div>
                                <div id="name-inp-block" class="validation-block std_margin">
                                    <label for="nameInp"><?= __("REG_USER_NAME") ?></label>
                                    <input id="nameInp" class="stretch-input" name="name" type="text" autocomplete="off">
                                    <div class="feedback invalid-feedback"><?= __("REG_INVALID_USER_NAME") ?></div>
                                </div>
                                <div id="pwd-inp-block" class="validation-block std_margin">
                                    <label for="passwordInp"><?= __("REG_PASSWORD") ?></label>
                                    <input id="passwordInp" class="stretch-input" name="password" type="password" autocomplete="off">
                                    <div class="feedback invalid-feedback"><?= __("REG_INVALID_PASSWORD") ?></div>
                                </div>
                                <div class="form-controls std_margin">
                                    <input class="btn submit-btn" type="submit" value="<?= __("SUBMIT") ?>">
                                    <a class="alter-link" href="<?= BASEURL ?>login/"><?= __("CANCEL") ?></a>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(TPL_PATH . "Footer.tpl");    ?>