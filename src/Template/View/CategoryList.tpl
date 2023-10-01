<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page">
    <div class="page_wrapper">
        <div class="container">
            <div class="content">
                <div class="content_wrap list-view__content">
                    <main>
                        <header id="heading" class="heading">
                            <h1><?= __("categories.listTitle") ?></h1>
                            <div class="heading-actions"></div>
                        </header>
                        <section id="contentContainer" class="content-container"></section>
                    </main>

                    <aside id="itemInfo" class="item-details" hidden></aside>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>