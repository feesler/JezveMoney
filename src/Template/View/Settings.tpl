<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap column-container">
                    <header class="heading">
                        <h1><?= __("settings.title") ?></h1>
                    </header>

                    <main id="tabsContainer">
                        <section id="mainTab" class="settings-block">
                            <header id="mainHeading" class="heading">
                                <h2><?= __("settings.main") ?></h2>
                            </header>
                            <div id="mainContainer"></div>
                        </section>

                        <section id="userCurrenciesTab" class="settings-block">
                            <header id="userCurrenciesHeading" class="heading">
                                <h2><?= __("settings.currencies.title") ?></h2>
                                <div class="heading-actions"></div>
                            </header>
                            <div id="userCurrenciesContainer">
                            </div>
                        </section>

                        <section id="regionalTab" class="settings-block">
                            <header id="dateFormatHeading" class="heading">
                                <h2><?= __("settings.dateFormat") ?></h2>
                                <div class="heading-actions"></div>
                            </header>
                            <div id="dateFormatContainer"></div>
                            <header id="decimalFormatHeading" class="heading">
                                <h2><?= __("settings.numberFormat") ?></h2>
                                <div class="heading-actions"></div>
                            </header>
                            <div id="decimalFormatContainer"></div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>