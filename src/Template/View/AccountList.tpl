<?php

use JezveMoney\App\Template\Component\IconButton;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div id="visibleTilesHeading" class="heading">
                        <h1>Accounts</h1>
                        <div class="heading-actions">
                            <?= IconButton::render([
                                "id" => "add_btn",
                                "type" => "link",
                                "link" => BASEURL . "accounts/create/",
                                "title" => "Create",
                                "icon" => "plus"
                            ]) ?>
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

<?php include(ICONS_PATH . "TileIcons.tpl");    ?>
<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>