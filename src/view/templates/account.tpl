<?php
    use JezveMoney\Core\JSON;
?>
<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
        <div class="container centered">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1><?=e($headString)?></h1>
<?php	if ($this->action == "update") {	?>
                        <div id="del_btn" class="iconlink">
                            <button type="button">
                                <span class="iconlink__icon"><?=svgIcon("del")?></span>
                                <span class="iconlink__content"><span>Delete</span></span>
                            </button>
                        </div>
<?php	}	?>
                    </div>

                    <div>
                        <form id="accForm" method="post" action="<?=e(BASEURL."accounts/".$this->action)?>/">
<?php	if ($this->action == "update") {		?>
                        <input id="accid" name="id" type="hidden" value="<?=e($accInfo->id)?>">
<?php	}	?>
                        <div class="view-row std_margin">
                            <div id="acc_tile" class="tile">
                                <button class="tilelink" type="button">
                                    <span>
                                        <span class="tile__subtitle"><?=e($accInfo->balfmt)?></span>
                                        <span class="tile__icon"><?=useIcon($accInfo->icon, 60, 54)?></span>
                                        <span class="tile__title"><?=e($tileAccName)?></span>
                                    </span>
                                </button>
                            </div>
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
                                <input id="accname" name="name" type="text" value="<?=e($accInfo->name)?>">
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
                                    <input class="amount-input" id="balance" name="initbalance" type="text" value="<?=e($accInfo->initbalance)?>">
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
<script>
    var view = new AccountView({
        account: <?=JSON::encode($accInfo)?>,
        currency: <?=JSON::encode($currArr)?>,
        icons: <?=JSON::encode($icons)?>
    });
</script>
</body>
</html>
