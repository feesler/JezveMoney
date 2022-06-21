<?php
use JezveMoney\App\Template\Component\Tile;
use JezveMoney\App\Template\Component\IconLink;

include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");	?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>Persons</h1>
                        <?=IconLink::render([
                            "id" => "add_btn",
                            "type" => "link",
                            "link" => BASEURL . "persons/create/",
                            "title" => "Create",
                            "icon" => "plus"
                        ])?>
                    </div>
                    <div id="tilesContainer" class="tiles">
<?php   if (count($persArr)) {
               foreach($persArr as $tile) {       ?>
<?=Tile::render($tile)?>
<?php       }
        } else {	?>
                        <span class="nodata-message">You have no one person. Please create one.</span>
<?php	}	?>
                    </div>
<?php	if (count($hiddenPersArr)) {	?>
                    <div class="heading">
                        <h1>Hidden</h1>
                    </div>
                    <div id="hiddenTilesContainer" class="tiles">
<?php		foreach($hiddenPersArr as $tile) {     ?>
<?=Tile::render($tile)?>
<?php		}   ?>
                    </div>
<?php	} else {	?>
                    <div id="hiddenTilesContainer" class="tiles hidden"></div>
<?php	}	?>
                </div>
            </div>
        </div>
    </div>

    <div id="toolbar" class="sidebar hidden">
        <div class="siderbar__content">
            <div id="sbEllipsis" class="sidebar__ellipsis"><?=svgIcon("sbellipsis")?></div>
            <div id="sbButtons" class="sidebar__controls">
                <?=IconLink::render([
                    "id" => "edit_btn",
                    "type" => "link",
                    "title" => "Edit",
                    "icon" => "edit",
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
<form id="showform" method="post" action="<?=BASEURL?>persons/show/">
<input id="showpersons" name="persons" type="hidden" value="">
</form>
<form id="hideform" method="post" action="<?=BASEURL?>persons/hide/">
<input id="hidepersons" name="persons" type="hidden" value="">
</form>
<form id="delform" method="post" action="<?=BASEURL?>persons/del/">
<input id="delpersons" name="persons" type="hidden" value="">
</form>

<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
