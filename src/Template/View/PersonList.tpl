<?php

use JezveMoney\App\Template\Component\IconButton;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>Persons</h1>
                        <?= IconButton::render([
                            "id" => "add_btn",
                            "type" => "link",
                            "link" => BASEURL . "persons/create/",
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
                <?= IconButton::render([
                    "id" => "edit_btn",
                    "type" => "link",
                    "title" => "Edit",
                    "icon" => "edit",
                    "hidden" => true
                ]) ?>
                <?= IconButton::render([
                    "id" => "show_btn",
                    "title" => "Restore",
                    "icon" => "show",
                    "hidden" => true
                ]) ?>
                <?= IconButton::render([
                    "id" => "hide_btn",
                    "title" => "Hide",
                    "icon" => "hide",
                    "hidden" => true
                ]) ?>
                <?= IconButton::render([
                    "id" => "del_btn",
                    "title" => "Delete",
                    "icon" => "del",
                    "hidden" => true
                ]) ?>
            </div>
        </div>
    </div>
</div>

<?php include(TPL_PATH . "Footer.tpl");    ?>