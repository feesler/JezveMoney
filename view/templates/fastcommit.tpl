<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
var accounts = <?=f_json_encode($accArr)?>;
var currencies = <?=f_json_encode($currArr)?>;
var persons = <?=f_json_encode($persArr)?>;

onReady(initPage);
</script>
</head>
<body>
<form id="fastcommitfrm" method="post" action="<?=BASEURL?>fastcommit/">
	<select id="acc_id" name="acc_id" onchange="onMainAccChange()">
<?php foreach($accArr as $accObj) {	?>
		<option value="<?=$accObj->id?>"><?=$accObj->name?></option>
<?php }	?>
	</select>
	<div id="rowsContainer"></div>
	<div class="controls">
		<div class="std_margin"><input class="btn ok_btn" type="button" onclick="createRow()" value="+"></div>
		<div><input id="submitbtn" class="btn ok_btn" type="button" value="Commit"></div>
	</div>
</form>
</body>
</html>
