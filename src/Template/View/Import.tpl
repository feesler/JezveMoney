<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page import-view">
    <div class="page_wrapper">
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header id="heading" class="heading">
                        <h1><?= __("import.listTitle") ?></h1>
                        <div class="heading-actions"></div>
                    </header>

                    <header id="contentHeader" class="content-header"></header>
                    <main id="formContainer" class="data-form"></main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>