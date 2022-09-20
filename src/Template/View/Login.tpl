<?php	include(TPL_PATH . "Header.tpl");	?>

<div class="layer login-layer">
    <div class="layer-box">
        <div class="logo-container">
            <div class="login-logo row-container">
                <span class="logo"><?=svgIcon("logo_u", "logo-icon")?></span>
                <span class="title">Jezve Money</span>
            </div>
        </div>
        <div class="form-container">
            <form id="loginfrm" class="login-form" action="<?=BASEURL?>login/" method="post">
                <h1>Log in</h1>
                <div id="login-inp-block" class="validation-block std_margin">
                    <label for="login">Username</label>
                    <input id="login" class="stretch-input" name="login" type="text" autocomplete="off">
                    <div class="invalid-feedback">Please input you login.</div>
                </div>
                <div id="pwd-inp-block" class="validation-block std_margin">
                    <label for="password">Password</label>
                    <input id="password" class="stretch-input" name="password" type="password" autocomplete="off">
                    <div class="invalid-feedback">Please input correct password.</div>
                </div>
                <div class="std_margin">
                    <label id="rememberCheck" class="checkbox">
                        <input type="checkbox" name="remember" checked>
                        <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
                        <span class="checkbox__label">Remember me</span>
                    </label>
                </div>
                <div class="form-controls std_margin">
                    <input class="btn submit-btn" type="submit" value="Log in">
                    <a class="alter-link" href="<?=BASEURL?>register/">Register</a>
                </div>
            </form>
        </div>
    </div>
</div>

<?php	include(TPL_PATH . "Footer.tpl");	?>
