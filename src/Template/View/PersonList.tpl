<?php

use JezveMoney\App\Template\Component\IconButton;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div id="visibleTilesHeading" class="heading">
                        <h1>Persons</h1>
                        <div class="heading-actions">
                            <?= IconButton::render([
                                "id" => "add_btn",
                                "type" => "link",
                                "classNames" => "circle-icon",
                                "link" => BASEURL . "persons/create/",
                                "title" => "Create",
                                "icon" => "plus"
                            ]) ?>
                        </div>
                    </div>
                    <div id="counters" class="counters">
                        <div class="counter">
                            <span class="counter__title">Items</span>
                            <span id="itemsCount" class="counter__value"></span>
                        </div>
                        <div class="counter">
                            <span class="counter__title">Hidden</span>
                            <span id="hiddenCount" class="counter__value"></span>
                        </div>
                        <div id="selectedCounter" class="counter" hidden>
                            <span class="counter__title">Selected</span>
                            <span id="selItemsCount" class="counter__value"></span>
                        </div>
                    </div>
                    <div id="hiddenTilesHeading" class="heading" hidden>
                        <h1>Hidden</h1>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>