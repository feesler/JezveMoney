<?php
use JezveMoney\App\Template\Component\Tile;
use JezveMoney\App\Template\Component\IconButton;

include(TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH . "Component/tpl/Header.tpl");		?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1><?=e($headString)?></h1>
<?php	if ($this->action == "update") {	?>
                        <?=IconButton::render([
                            "id" => "del_btn",
                            "classNames" => "circle-icon",
                            "title" => "Delete",
                            "icon" => "del"
                        ])?>
<?php	}	?>
                    </div>

                    <div>
                        <form id="accForm" method="post" action="<?=e(BASEURL."accounts/".$this->action)?>/">
<?php	if ($this->action == "update") {		?>
                        <input id="accid" name="id" type="hidden" value="<?=e($accInfo->id)?>">
<?php	}	?>
                        <div class="view-row std_margin">
                            <?=Tile::render($tile)?>
                        </div>
                        <div id="icon-block" class="view-row std_margin">
                            <label for="icon">Icon</label>
                            <div>
                                <select id="icon" name="icon_id">
<?php	if ($accInfo->icon_id == 0) {	?>
                                    <option value="0" selected>No icon</option>
<?php	} else {	?>
                                    <option value="0">No icon</option>
<?php	}	?>
<?php	foreach($icons as $icon) {
            if ($icon->id == $accInfo->icon_id) {		?>
                                    <option value="<?=e($icon->id)?>" selected><?=e($icon->name)?></option>
<?php		} else {	?>
                                    <option value="<?=e($icon->id)?>"><?=e($icon->name)?></option>
<?php		}
        }		?>
                                </select>
                            </div>
                        </div>
                        <div id="name-inp-block" class="validation-block view-row std_margin">
                            <label for="accname">Account name</label>
                            <input id="accname" class="stretch-input" name="name" type="text" autocomplete="off" value="<?=e($accInfo->name)?>">
                            <div id="namefeedback" class="invalid-feedback"></div>
                        </div>
                        <div id="currency-block" class="view-row std_margin">
                            <label for="currency">Currency</label>
                            <div>
                                <select id="currency" name="curr_id"></select>
                            </div>
                        </div>
                        <div id="initbal-inp-block" class="validation-block view-row std_margin">
                            <label for="balance">Initial balance</label>
                            <div class="input-group">
                                <input id="balance" class="input-group__input stretch-input right-align-text" name="initbalance" type="text" autocomplete="off" value="<?=e($accInfo->initbalance)?>">
                                <div id="currsign" class="input-group__text"><?=e($accInfo->sign)?></div>
                            </div>
                            <div class="invalid-feedback">Input correct initial balance.</div>
                        </div>
                        <div class="form-controls">
                            <input id="submitBtn" class="btn submit-btn" type="submit" value="Submit">
                            <a id="cancelBtn" class="btn cancel-btn" href="<?=BASEURL?>accounts/">Cancel</a>
                        </div>
                        <input id="flags" name="flags" type="hidden" value="<?=e($accInfo->flags)?>">
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(ICONS_PATH . "TileIcons.tpl");	?>
<?php	include(ICONS_PATH . "Common.tpl");	?>
<?php	include(TPL_PATH . "Footer.tpl");	?>
