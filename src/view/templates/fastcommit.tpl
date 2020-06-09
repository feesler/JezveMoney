<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="import_form">
<form id="fileimportfrm" method="post" enctype="multipart/form-data" action="<?=BASEURL?>fastcommit/upload">
	<div class="clearfix">
		<div class="checkwrap inputwrap"><label><input id="fileUploadRadio" type="radio" name="importTypeRadio"><span>File upload</span><input id="fileInp" type="file"></label></div>
	</div>
	<div class="clearfix">
		<div class="checkwrap inputwrap"><label><input type="radio" name="importTypeRadio"><span>Server</span><input id="srvFilePath" name="srvFilePath" type="text"></label></div>
	</div>
	<div class="clearfix">
		<div>
			<label>Statement type</label>
			<select id="statTypeSel">
				<option value="0">Account</option>
				<option value="1">Debt card</option>
				<option value="2">Credit card</option>
			</select>
		</div>
		<div class="checkwrap"><label><input id="isEncodeCheck" name="encode" type="checkbox"><span>CP-1251 encoding</span></label></div>
	</div>
	<div class="clearfix">
		<input id="importbtn" class="btn ok_btn" type="submit" value="Import">
	</div>
</form>
</div>

	<select id="acc_id" name="acc_id">
<?php foreach($accArr as $accObj) {	?>
		<option value="<?=e($accObj->id)?>"><?=e($accObj->name)?></option>
<?php }	?>
	</select>

	<div class="clearfix">
		<table><tbody id="importRows"></tbody></table>
		<div id="rowsContainer"></div>
	</div>
	<div class="controls">
		<div class="std_margin">
			<input id="newRowBtn" class="btn ok_btn" type="button" value="+">
			<input id="newPhBtn" class="btn ok_btn" type="button" value="+">
			<input id="importAllBtn" class="btn ok_btn" type="button" value="<?=e("->>")?>" disabled>
		</div>
		<div>
			<input id="submitbtn" class="btn ok_btn" type="button" value="Commit">Transactions: <span id="trcount">0</span><br>
			<span id="importpickstats" style="display: none;">Not picked on import: <span id="notpickedcount"></span></span>
		</div>
	</div>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>
var accounts = <?=JSON::encode($accArr)?>;
var currencies = <?=JSON::encode($currArr)?>;
var persons = <?=JSON::encode($persArr)?>;

onReady(initPage);
</script>
</body>
</html>
