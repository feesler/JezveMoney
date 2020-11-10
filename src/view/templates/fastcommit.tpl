<?php
    use JezveMoney\Core\JSON;
?>
<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="import_form">
<form id="fileimportfrm" method="post" enctype="multipart/form-data" action="<?=BASEURL?>fastcommit/upload">
    <div>
        <div class="checkwrap inputwrap">
            <label>
                <input id="fileUploadRadio" type="radio" name="importTypeRadio">
                <span>File upload</span>
                <input id="fileInp" type="file">
            </label>
        </div>
    </div>
    <div>
        <div class="checkwrap inputwrap">
            <label>
                <input type="radio" name="importTypeRadio">
                <span>Server</span>
                <input id="srvFilePath" name="srvFilePath" type="text">
            </label>
        </div>
    </div>
    <div>
        <div>
            <label>Statement type</label>
            <select id="templateSel">
<?php   foreach($impTemplates as $impTpl) {     ?>
                <option value="<?=e($impTpl->id)?>"><?=e($impTpl->name)?></option>
<?php   }   ?>
            </select>
        </div>
        <div class="checkwrap">
            <label>
                <input id="isEncodeCheck" name="encode" type="checkbox">
                <span>CP-1251 encoding</span>
            </label>
        </div>
    </div>
    <div>
        <input id="importbtn" class="btn submit-btn" type="submit" value="Import">
    </div>
</form>
</div>

    <select id="acc_id" name="acc_id">
<?php foreach($accArr as $accObj) {	?>
        <option value="<?=e($accObj->id)?>"><?=e($accObj->name)?></option>
<?php }	?>
    </select>

    <div class="data-container">
        <table class="import-tbl"><tbody id="importRows"></tbody></table>
        <div id="rowsContainer"></div>
    </div>
    <div class="import-controls">
        <div class="std_margin">
            <input id="newRowBtn" class="btn submit-btn" type="button" value="+">
            <input id="newPhBtn" class="btn submit-btn" type="button" value="+">
            <input id="importAllBtn" class="btn submit-btn" type="button" value="<?=e("->>")?>" disabled>
        </div>
        <div>
            <input id="submitbtn" class="btn submit-btn" type="button" value="Commit">Transactions: <span id="trcount">0</span><br>
            <span id="importpickstats" class="hidden">Not picked on import: <span id="notpickedcount"></span></span>
        </div>
    </div>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>
var view = new ImportView({
    accounts: <?=JSON::encode($accArr)?>,
    currencies: <?=JSON::encode($currArr)?>,
    persons: <?=JSON::encode($persArr)?>,
});
</script>
</body>
</html>
