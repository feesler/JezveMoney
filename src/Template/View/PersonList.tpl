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
                        <header id="contentHeader" class="content-header">
                            <div class="counters">
                                <div id="itemsCounter" class="counter">
                                    <span class="counter__title"><?= __("list.itemsCounter") ?></span>
                                    <span id="itemsCount" class="counter__value"></span>
                                </div>
                                <div id="hiddenCounter" class="counter">
                                    <span class="counter__title"><?= __("list.hiddenItemsCounter") ?></span>
                                    <span id="hiddenCount" class="counter__value"></span>
                                </div>
                                <div id="selectedCounter" class="counter" hidden>
                                    <span class="counter__title"><?= __("list.selectedItemsCounter") ?></span>
                                    <span id="selItemsCount" class="counter__value"></span>
                                </div>
                            </div>
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