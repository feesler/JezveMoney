<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="layer login-layer">
    <div class="layer-box">
        <header class="logo-container">
            <div class="login-logo row-container">
                <span class="logo"><?= svgIcon("logo_u", "logo-icon") ?></span>
                <span class="title"><?= __("APP_NAME") ?></span>
            </div>
        </header>
        <main class="form-container">
            <form id="form" class="login-form" action="<?= BASEURL ?>login/" method="post">
                <h1><?= __("LOG_IN") ?></h1>
                <div id="login-inp-block" class="validation-block std_margin">
                    <label for="loginInp"><?= __("LOG_IN_USERNAME") ?></label>
                    <input id="loginInp" class="stretch-input" name="login" type="text" autocomplete="off">
                    <div class="invalid-feedback"><?= __("LOG_IN_INVALID_USERNAME") ?></div>
                </div>
                <div id="pwd-inp-block" class="validation-block std_margin">
                    <label for="passwordInp"><?= __("LOG_IN_PASSWORD") ?></label>
                    <input id="passwordInp" class="stretch-input" name="password" type="password" autocomplete="off">
                    <div class="invalid-feedback"><?= __("LOG_IN_INVALID_PASSWORD") ?></div>
                </div>
                <div class="std_margin">
                    <label id="rememberCheck" class="checkbox">
                        <input type="checkbox" name="remember" checked>
                        <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                        <span class="checkbox__label"><?= __("LOG_IN_REMEMBER") ?></span>
                    </label>
                </div>
                <div class="form-controls std_margin">
                    <input class="btn submit-btn" type="submit" value="<?= __("LOG_IN_BUTTON") ?>">
                    <a class="alter-link" href="<?= BASEURL ?>register/"><?= __("REGISTRATION") ?></a>
                </div>
            </form>
        </main>
    </div>
</div>

<?php include(TPL_PATH . "Footer.tpl");    ?>