<?php	include("./view/templates/commonhdr.tpl");	?>
<style>
.tr_row
{
	padding: 10px;
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

.tr_row input[type=button]
{
	width: 30px;
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
	<div>
		<input type="button" onclick="createRow()" value="+">
	</div>
	<div>
		<input type="submit" value="Commit">
	</div>
</form>
</body>
</html>
