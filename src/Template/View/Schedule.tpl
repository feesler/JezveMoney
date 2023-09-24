<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page schedule-view">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap list-view__content">
                    <main>
                        <header id="heading" class="heading">
                            <h1><?= __("schedule.listTitle") ?></h1>
                            <div class="heading-actions"></div>
                        </header>

                        <header id="contentHeader" class="content-header">
                            <header class="list-header">
                                <div class="counters">
                                    <div id="itemsCounter" class="counter">
                                        <span class="counter__title"><?= __("list.itemsCounter") ?></span>
                                        <span id="itemsCount" class="counter__value"></span>
                                    </div>
                                    <div id="selectedCounter" class="counter" hidden>
                                        <span class="counter__title"><?= __("list.selectedItemsCounter") ?></span>
                                        <span id="selItemsCount" class="counter__value"></span>
                                    </div>
                                </div>
                            </header>
                        </header>

                        <section id="contentContainer" class="list-container"></section>
                        <footer class="list-footer"></footer>
                    </main>

                    <aside id="itemInfo" class="item-details" hidden></aside>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>