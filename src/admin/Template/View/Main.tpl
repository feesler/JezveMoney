<?php include(ADMIN_TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php include(ADMIN_TPL_PATH . "Component/Header.tpl");    ?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <section id="mainTab" class="settings-block">
                        <header id="mainHeading" class="heading">
                            <h2><?= __("SETTINGS_MAIN") ?></h2>
                        </header>
                        <div id="mainContainer">
                            <div id="enableLogsField" class="field form-row horizontal-field">
                                <span class="field__title">Enable logs</span>
                                <label id="enableLogsSwitch" class="switch">
                                    <input type="checkbox" <?= checked($enableLogs) ?>>
                                    <div class="switch-slider"></div>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ADMIN_TPL_PATH . "Footer.tpl");    ?>