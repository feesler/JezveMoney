<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
	var currency = <?=f_json_encode($currArr)?>;

	onReady(initControls);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include("./view/templates/header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h2>Currencies</h2>

					<table id="currencies_tbl" class="adm_tbl">
						<thead>
							<tr><th>id</th><th>name</th><th>sign</th><th>format</th></tr>
						</thead>
						<tbody>
<?php	foreach($currArr as $currInfo) {		?>
							<tr>
								<td><?=$currInfo->id?></td>
								<td><?=$currInfo->name?></td>
								<td><?=$currInfo->sign?></td>
								<td><?=$currInfo->format?></td>
							</tr>
<?php	}	?>
						</tbody>
					</table>

					<div class="acc_controls">
						<input class="adm_act_btn" type="button" value="new" onclick="newCurr()">
						<input id="updbtn" class="adm_act_btn" type="button" value="update" onclick="updateCurr()" style="display: none;">
						<input id="del_btn" class="adm_act_btn" type="button" value="delete" onclick="deleteCurr()" style="display: none;">
					</div>

					<form id="delfrm" method="post" action="<?=BASEURL?>admin/currency/del" onsubmit="return onDeleteSubmit(this);">
						<input id="del_curr_id" name="curr_id" type="hidden">
					</form>
				</div>
			</div>
		</div>
	</div>
</div>

<form id="curr_frm" method="post" action="<?=BASEURL?>admin/currency/new" style="display: none;">
<input id="curr_id" name="curr_id" type="hidden">
<div class="non_float">
	<label for="curr_name">Name</label>
	<div class="stretch_input"><input id="curr_name" name="curr_name" type="text"></div>
</div>
<div class="non_float">
	<label for="curr_sign">Sign</label>
	<div class="stretch_input"><input id="curr_sign" name="curr_sign" type="text"></div>
</div>
<div class="check_wr"><input id="curr_format" name="curr_format" type="checkbox"><label for="curr_format">Sign before value</label></div>
</form>
</body>
</html>
