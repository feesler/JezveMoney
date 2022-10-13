<?php
use JezveMoney\App\Template\Component\IconButton;

include(TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH . "Component/tpl/Header.tpl");	?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1><?=e($headString)?></h1>
<?php	if ($this->action == "update") {		?>
                        <?=IconButton::render([
                            "id" => "del_btn",
                            "title" => "Delete",
                            "icon" => "del"
                        ])?>
<?php	}	?>
                    </div>
                    <div>
                        <form id="personForm" method="post" action="<?=e(BASEURL."persons/".$this->action)?>/">
<?php	if ($this->action == "update") {		?>
                        <input id="pid" name="id" type="hidden" value="<?=e($pInfo->id)?>">
<?php	}	?>
                        <div id="name-inp-block" class="validation-block view-row std_margin">
                            <label for="pname">Person name</label>
                            <input id="pname" class="stretch-input" name="name" type="text" autocomplete="off" value="<?=e($pInfo->name)?>">
                            <div id="namefeedback" class="invalid-feedback"></div>
                        </div>

                        <div class="form-controls">
                            <input id="submitBtn" class="btn submit-btn" type="submit" value="Submit">
                            <a id="cancelBtn" class="btn cancel-btn" href="<?=BASEURL?>persons/">Cancel</a>
                        </div>
                        <input id="flags" name="flags" type="hidden" value="<?=e($pInfo->flags)?>">
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(TPL_PATH . "Footer.tpl");	?>
