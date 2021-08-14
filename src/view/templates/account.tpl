<?php
use JezveMoney\App\Template\Tile;
use JezveMoney\App\Template\IconLink;

include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
        <div class="container centered">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1><?=e($headString)?></h1>
<?php	if ($this->action == "update") {	?>
                        <?=IconLink::render([
                            "id" => "del_btn",
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
                        <div class="view-row std_margin">
                            <label for="icon">Icon</label>
                            <div class="std_margin">
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
                            <div class="stretch-input std_margin">
                                <input id="accname" name="name" type="text" autocomplete="off" value="<?=e($accInfo->name)?>">
                            </div>
                            <div class="invalid-feedback">Please input name of account.</div>
                        </div>
                        <div class="view-row std_margin">
                            <label for="currency">Currency</label>
                            <div class="std_margin">
                                <select id="currency" name="curr_id">
<?php	foreach($currArr as $currInfo) {
            if ($currInfo->id == $accInfo->curr_id) {	?>
                                    <option value="<?=e($currInfo->id)?>" selected><?=e($currInfo->name)?></option>
<?php		} else {	?>
                                    <option value="<?=e($currInfo->id)?>"><?=e($currInfo->name)?></option>
<?php		}
        }		?>
                                </select>
                            </div>
                        </div>
                        <div id="initbal-inp-block" class="validation-block view-row std_margin">
                            <label for="balance">Initial balance</label>
                            <div class="input-group std_margin">
                                <div class="stretch-input">
                                    <input class="amount-input" id="balance" name="initbalance" type="text" autocomplete="off" value="<?=e($accInfo->initbalance)?>">
                                </div>
                                <div class="btn input-group__btn input-group__btn_inactive"><div id="currsign"><?=e($accInfo->sign)?></div></div>
                            </div>
                            <div class="invalid-feedback">Please input correct initial balance.</div>
                        </div>
                        <div class="acc_controls">
                            <input class="btn submit-btn" type="submit" value="ok">
                            <a class="btn cancel-btn" href="<?=BASEURL?>accounts/">cancel</a>
                        </div>
                        <input id="flags" name="flags" type="hidden" value="<?=e($accInfo->flags)?>">
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php	if ($this->action == "update") {	?>
<form id="delform" method="post" action="<?=BASEURL?>accounts/del">
<input name="accounts" type="hidden" value="<?=e($accInfo->id)?>">
</form>
<?php	}	?>

<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
