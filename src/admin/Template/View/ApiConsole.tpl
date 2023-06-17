<?php include(ADMIN_TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php include(ADMIN_TPL_PATH . "Component/Header.tpl");    ?>
        <div id="apiMenu" class="navigation navigation_closed">
            <nav id="apiMenuContent" class="navigation-content">
                <div id="apiMenuControls" class="navigation-controls">
                    <div class="navigation-logo">
                        <div class="header-logo">
                            <span class="header-logo__title">API Methods</span>
                        </div>
                    </div>
                </div>
            </nav>
            <div class="navigation-bg"></div>
        </div>

        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header id="heading" class="heading">
                        <h1>API console</h1>
                        <div class="heading-actions"></div>
                    </header>

                    <div class="api-console">
                        <div id="formsContainer" class="center-column"></div>

                        <div class="right-column">
                            <div id="resultsHeading" class="request-log">
                                <h2>Request log</h2>
                            </div>
                            <div id="resultsContainer"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(ADMIN_TPL_PATH . "Footer.tpl");    ?>