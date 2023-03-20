<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap column-container">
                    <header class="heading">
                        <h1><?= __("SETTINGS") ?></h1>
                    </header>

                    <main>
                        <section class="settings-block">
                            <header id="userCurrenciesHeading" class="heading">
                                <h2><?= __("SETTINGS_CURRENCIES") ?></h2>
                                <div class="heading-actions"></div>
                            </header>
                            <div id="userCurrenciesContainer">
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>