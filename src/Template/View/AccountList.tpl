<?php

use JezveMoney\App\Template\Component\IconLink;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>Accounts</h1>
                        <?= IconLink::render([
                            "id" => "add_btn",
                            "type" => "link",
                            "link" => BASEURL . "accounts/create/",
                            "title" => "Create",
                            "icon" => "plus"
                        ]) ?>
                    </div>
                    <div id="tilesContainer" class="tiles"></div>
                    <div id="hiddenTilesHeading" class="heading" hidden>
                        <h1>Hidden</h1>
                    </div>
                    <div id="hiddenTilesContainer" class="tiles"></div>
                </div>
            </div>
        </div>
    </div>
    <div id="toolbar" class="sidebar" hidden>
        <div class="siderbar__content">
            <div id="sbEllipsis" class="sidebar__ellipsis"><?= svgIcon("sbellipsis", "icon") ?></div>
            <div id="sbButtons" class="sidebar__controls">
                <?= IconLink::render([
                    "id" => "edit_btn",
                    "type" => "link",
                    "title" => "Edit",
                    "icon" => "edit",
                    "hidden" => true
                ]) ?>
                <?= IconLink::render([
                    "id" => "export_btn",
                    "type" => "link",
                    "title" => "Export to CSV",
                    "icon" => "export",
                    "hidden" => true
                ]) ?>
                <?= IconLink::render([
                    "id" => "show_btn",
                    "title" => "Restore",
                    "icon" => "show",
                    "hidden" => true
                ]) ?>
                <?= IconLink::render([
                    "id" => "hide_btn",
                    "title" => "Hide",
                    "icon" => "hide",
                    "hidden" => true
                ]) ?>
                <?= IconLink::render([
                    "id" => "del_btn",
                    "title" => "Delete",
                    "icon" => "del",
                    "hidden" => true
                ]) ?>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "TileIcons.tpl");    ?>
<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>