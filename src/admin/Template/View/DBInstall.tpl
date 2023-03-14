<?php include(ADMIN_TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php include(ADMIN_TPL_PATH . "Component/Header.tpl");    ?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>DB Update</h2>

                    <div>
                        <div>Current DB version: <?= e($currentDBVersion) ?></div>
                        <div>Latest DB version: <?= e($latestDBVersion) ?></div>
                        <?php if ($currentDBVersion == $latestDBVersion) {        ?>
                            <div>Database is up to date</div>
                        <?php    } else {        ?>
                            <div>Database update is required</div>
                        <?php    }        ?>
                    </div>

                    <form method="POST" action="<?= BASEURL . "admin/dbinstall/update" ?>">
                        <div class="form-controls">
                            <input id="updbtn" class="btn submit-btn" type="submit" value="update" <?= disabled($currentDBVersion == $latestDBVersion) ?>>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ADMIN_TPL_PATH . "Footer.tpl");    ?>