<?php
use JezveMoney\App\Template\Component\Tile;
use JezveMoney\App\Template\Component\IconLink;

include(TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH . "Component/tpl/Header.tpl");		?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>Accounts</h1>
                        <?=IconLink::render([
                            "id" => "add_btn",
                            "type" => "link",
                            "link" => BASEURL . "accounts/create/",
                            "title" => "Create",
                            "icon" => "plus"
                        ])?>
                    </div>
                    <div id="tilesContainer" class="tiles">
<?php   if (count($tilesArr)) {     ?>
<?php		foreach($tilesArr as $acc_id => $tile) {    ?>
<?=Tile::render($tile)?>
<?php       }   ?>
<?php	} else {	?>
                        <span class="nodata-message">You have no one account. Please create one.</span>
<?php   }   ?>
                    </div>
<?php	if (count($hiddenTilesArr)) {	?>
                    <div class="heading">
                        <h1>Hidden</h1>
                    </div>
                    <div id="hiddenTilesContainer" class="tiles">
<?php       foreach($hiddenTilesArr as $acc_id => $tile) {  ?>
<?=Tile::render($tile)?>
<?php       }   ?>
                    </div>
<?php	} else {	?>
                    <div id="hiddenTilesContainer" class="tiles" hidden></div>
<?php	}	?>
                </div>
            </div>
        </div>
    </div>
    <div id="toolbar" class="sidebar" hidden>
        <div class="siderbar__content">
            <div id="sbEllipsis" class="sidebar__ellipsis"><?=svgIcon("sbellipsis", "icon")?></div>
            <div id="sbButtons" class="sidebar__controls">
                <?=IconLink::render([
                    "id" => "edit_btn",
                    "type" => "link",
                    "title" => "Edit",
                    "icon" => "edit",
                    "hidden" => true
                ])?>
                <?=IconLink::render([
                    "id" => "export_btn",
                    "type" => "link",
                    "title" => "Export to CSV",
                    "icon" => "export",
                    "hidden" => true
                ])?>
                <?=IconLink::render([
                    "id" => "show_btn",
                    "title" => "Restore",
                    "icon" => "show",
                    "hidden" => true
                ])?>
                <?=IconLink::render([
                    "id" => "hide_btn",
                    "title" => "Hide",
                    "icon" => "hide",
                    "hidden" => true
                ])?>
                <?=IconLink::render([
                    "id" => "del_btn",
                    "title" => "Delete",
                    "icon" => "del",
                    "hidden" => true
                ])?>
            </div>
        </div>
    </div>
</div>
<form id="showform" method="post" action="<?=BASEURL?>accounts/show/">
<input id="showaccounts" name="accounts" type="hidden" value="">
</form>
<form id="hideform" method="post" action="<?=BASEURL?>accounts/hide/">
<input id="hideaccounts" name="accounts" type="hidden" value="">
</form>
<form id="delform" method="post" action="<?=BASEURL?>accounts/del/">
<input id="delaccounts" name="accounts" type="hidden" value="">
</form>

<?php	include(TPL_PATH . "Icons.tpl");	?>
<?php	include(TPL_PATH . "Footer.tpl");	?>
