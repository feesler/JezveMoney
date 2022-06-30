<?php
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
                        <h1><?=e($headString)?></h1>
<?php	if ($this->action == "update") {		?>
                        <?=IconLink::render([
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
                            <input id="pname" class="stretch-input std_margin" name="name" type="text" autocomplete="off" value="<?=e($pInfo->name)?>">
                            <div id="namefeedback" class="invalid-feedback"></div>
                        </div>

                        <div class="acc_controls">
                            <input class="btn submit-btn" type="submit" value="ok">
                            <a class="btn cancel-btn" href="<?=BASEURL?>persons/">cancel</a>
                        </div>
                        <input id="flags" name="flags" type="hidden" value="<?=e($pInfo->flags)?>">
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php	if ($this->action == "update") {		?>
<form id="delform" method="post" action="<?=BASEURL?>persons/del/">
<input name="persons" type="hidden" value="<?=e($pInfo->id)?>">
</form>
<?php	}	?>

<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
