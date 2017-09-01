<?php	include("./view/templates/commonhdr.tpl");	?>
<style>
.tr_row
{
	padding: 10px;
}

#acc_id,
.controls
{
	margin: 10px;
}

.tr_row > select,
.tr_row input
{
	display: inline;
	border: 1px solid #000;
	padding: 5px;
	width: 100px;
	margin: 0px 5px 0px 0px;
}

.tr_row > select[disabled],
.tr_row input[disabled]
{
	border-color: #BBBBBB;
}

.tr_row input[type=button]
{
	width: 30px;
	border: 0 none;
}
</style>
<script>
var accounts = <?=f_json_encode($accArr)?>;

onReady(function()
{
	createRow();
});
</script>
</head>
<body>
<form method="post" action="<?=BASEURL?>fastcommit/" onsubmit="onSubmit()">
	<select id="acc_id" name="acc_id" onchange="onMainAccChange()">
<?php foreach($accArr as $accObj) {	?>
		<option value="<?=$accObj->id?>"><?=$accObj->name?></option>
<?php }	?>
	</select>
	<div id="rowsContainer"></div>
	<div class="controls">
		<div class="std_margin"><input class="btn ok_btn" type="button" onclick="createRow()" value="+"></div>
		<div><input class="btn ok_btn" type="submit" value="Commit"></div>
	</div>
</form>
</body>
</html>
