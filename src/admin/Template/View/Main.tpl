<?php include(ADMIN_TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <section id="mainTab" class="settings-block">
                        <header id="mainHeading" class="heading">
                            <h2><?= __("settings.main") ?></h2>
                        </header>
                        <div id="mainContainer">
                            <label id="enableLogsField" class="switch switch-field form-row">
                                <input type="checkbox" <?= checked($enableLogs) ?>>
                                <div class="switch-slider"></div>
                                <span class="switch__label">Enable logs</span>
                            </label>

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