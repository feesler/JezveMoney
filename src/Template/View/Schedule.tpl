<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page schedule-view">
    <div class="page_wrapper">
        <div class="container">
            <div class="content">
                <div class="content_wrap list-view__content">
                    <main>
                        <header id="heading" class="heading">
                            <h1><?= __("schedule.listTitle") ?></h1>
                            <div class="heading-actions"></div>
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