<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header class="heading">
                        <h1><?= __("ABOUT") ?></h1>
                    </header>
                    <main>
                        <div><?= __("APP_NAME") ?>, 2012-<?= e($year) ?></div>
                        <div><?= __("ABOUT_VERSION") ?>: <?= e($version) ?></div>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>