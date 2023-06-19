<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="layer login-layer">
    <div class="layer-box">
        <header class="logo-container">
            <div class="login-logo row-container">
                <span class="logo"><?= svgIcon("logo_u", "logo-icon") ?></span>
                <span class="title"><?= __("appName") ?></span>
            </div>
        </header>

        <main id="formContainer" class="form-container"></main>
    </div>
</div>

<?php include(TPL_PATH . "Footer.tpl");    ?>