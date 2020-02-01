<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
var accounts = <?=JSON::encode($accArr)?>;
var currencies = <?=JSON::encode($currArr)?>;
var persons = <?=JSON::encode($persArr)?>;

onReady(initPage);
</script>
</head>
<body>
<form id="fileimportfrm" method="post" enctype="multipart/form-data" action="<?=BASEURL?>fastcommit/upload">
	<div class="clearfix">
		<div class="checkwrap inputwrap"><label><input id="fileUploadRadio" type="radio" name="importTypeRadio"><span>File upload</span><input id="fileInp" type="file"></label></div>
	</div>
	<div class="clearfix">
		<div class="checkwrap inputwrap"><label><input type="radio" name="importTypeRadio"><span>Server</span><input id="srvFilePath" name="srvFilePath" type="text"></label></div>
	</div>
	<div class="clearfix">
		<div class="checkwrap"><label><input id="isCardCheck" name="isCardCheck" name="isCardCheck" type="checkbox"><span>Card statement</span></label></div>
	</div>
	<div class="clearfix">
		<input id="importbtn" class="btn ok_btn" type="submit" value="Import">
	</div>
</form>

<form id="fastcommitfrm" method="post" action="<?=BASEURL?>fastcommit/">
	<select id="acc_id" name="acc_id">
<?php foreach($accArr as $accObj) {	?>
		<option value="<?=$accObj->id?>"><?=$accObj->name?></option>
<?php }	?>
	</select>

	<div class="clearfix">
		<table><tbody id="importRows"></tbody></table>
		<div id="rowsContainer"></div>
	</div>
	<div class="controls">
		<div class="std_margin"><input id="newRowBtn" class="btn ok_btn" type="button" value="+"><input id="newPhBtn" class="btn ok_btn" type="button" value="+"></div>
		<div><input id="submitbtn" class="btn ok_btn" type="button" value="Commit">Transactions: <span id="trcount">0</span></div>
	</div>
</form>
</body>
</html>
