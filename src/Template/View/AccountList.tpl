<?php

use JezveMoney\App\Template\Component\IconButton;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div id="heading" class="heading">
                        <h1>Accounts</h1>
                        <div class="heading-actions">
                            <?= IconButton::render([
                                "id" => "createBtn",
                                "type" => "link",
                                "classNames" => "circle-icon",
                                "link" => BASEURL . "accounts/create/",
                                "title" => "Create",
                                "icon" => "plus"
                            ]) ?>
                        </div>
                    </div>
                    <div id="contentHeader" class="content-header">
                        <div class="counters">
                            <div id="itemsCounter" class="counter">
                                <span class="counter__title">Items</span>
                                <span id="itemsCount" class="counter__value"></span>
                            </div>
                            <div id="hiddenCounter" class="counter">
                                <span class="counter__title">Hidden</span>
                                <span id="hiddenCount" class="counter__value"></span>
                            </div>
                            <div id="selectedCounter" class="counter" hidden>
                                <span class="counter__title">Selected</span>
                                <span id="selItemsCount" class="counter__value"></span>
                            </div>
                        </div>
                    </div>
                    <div id="contentContainer" class="content-container">
                        <div id="hiddenTilesHeading" class="heading" hidden>
                            <h1>Hidden</h1>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "TileIcons.tpl");    ?>
<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>