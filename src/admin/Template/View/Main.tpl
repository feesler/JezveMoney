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

                            <hr class="form-separator">

                            <div class="field form-row horizontal-field">
                                <span class="field__title">Latest DB version</span>
                                <span><?= e($latestDBVersion) ?></span>
                            </div>

                            <div class="field form-row horizontal-field">
                                <span class="field__title">Current DB version:</span>
                                <span><?= e($currentDBVersion) ?></span>
                            </div>

                            <div class="field form-row horizontal-field">
                                <?php if ($currentDBVersion == $latestDBVersion) {        ?>
                                    <div class="feedback valid-feedback">Database is up to date</div>
                                <?php    } else {        ?>
                                    <div class="feedback invalid-feedback">Database update is required</div>
                                <?php    }        ?>
                                <form method="POST" action="<?= BASEURL . "admin/update" ?>">
                                    <input class="btn submit-btn" type="submit" value="Update" <?= hidden($currentDBVersion == $latestDBVersion) ?>>
                                </form>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ADMIN_TPL_PATH . "Footer.tpl");    ?>