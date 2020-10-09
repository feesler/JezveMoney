<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<form id="loginfrm" action="<?=BASEURL?>login/" method="post">
<div class="layer login-layer">
    <div class="layer-box">
        <div class="logo-container">
            <div class="login-logo row-container">
                <span class="logo"><?=svgIcon("logo_u")?></span>
                <span class="title">Jezve Money</span>
            </div>
        </div>
        <div class="form-container">
            <div class="login-form">
                <h1>Log in</h1>
                <div id="login-inp-block" class="validation-block std_margin">
                    <label for="login">Username</label>
                    <div class="stretch-input"><input id="login" name="login" type="text"></div>
                    <div class="invalid-feedback">Please input you login.</div>
                </div>
                <div id="pwd-inp-block" class="validation-block std_margin">
                    <label for="password">Password</label>
                    <div class="stretch-input"><input id="password" name="password" type="password"></div>
                    <div class="invalid-feedback">Please input correct password.</div>
                </div>
                <div class="form-controls std_margin">
                    <input class="btn submit-btn" type="submit" value="Log in">
                    <span class="alter_link"><a href="<?=BASEURL?>register/">Register</a></span>
                </div>
            </div>
        </div>
    </div>
</div>
</form>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>
var view = new LoginView();
</script>
</body>
</html>
