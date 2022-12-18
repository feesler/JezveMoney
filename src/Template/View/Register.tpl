<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="form-container">
                        <div class="register-form">
                            <h1>Registration</h1>
                            <form id="form" action="<?= BASEURL ?>register/" method="post">
                                <div id="login-inp-block" class="validation-block std_margin">
                                    <label for="loginInp">Account name</label>
                                    <input id="loginInp" class="stretch-input" name="login" type="text" autocomplete="off">
                                    <div class="invalid-feedback">Input your login.</div>
                                </div>
                                <div id="name-inp-block" class="validation-block std_margin">
                                    <label for="nameInp">Name</label>
                                    <input id="nameInp" class="stretch-input" name="name" type="text" autocomplete="off">
                                    <div class="invalid-feedback">Input name.</div>
                                </div>
                                <div id="pwd-inp-block" class="validation-block std_margin">
                                    <label for="passwordInp">Password</label>
                                    <input id="passwordInp" class="stretch-input" name="password" type="password" autocomplete="off">
                                    <div class="invalid-feedback">Input password.</div>
                                </div>
                                <div class="form-controls std_margin">
                                    <input class="btn submit-btn" type="submit" value="Submit">
                                    <a class="alter-link" href="<?= BASEURL ?>login/">Log in</a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(TPL_PATH . "Footer.tpl");    ?>