<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap list-view__content">
                    <main>
                        <header id="heading" class="heading">
                            <h1><?= __("persons.listTitle") ?></h1>
                            <div class="heading-actions"></div>
                        </header>
                        <section id="contentContainer" class="content-container">
                            <div id="hiddenTilesHeading" class="heading" hidden>
                                <h1><?= __("list.hiddenItemsCounter") ?></h1>
                            </div>
                        </section>
                    </main>

                    <aside id="itemInfo" class="item-details" hidden></aside>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>