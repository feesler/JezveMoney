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

					<form id="delfrm" method="post" action="<?=BASEURL?>admin/currency.php?act=del" onsubmit="return onDeleteSubmit(this);">
						<input id="del_curr_id" name="curr_id" type="hidden">
					</form>
				</div>
			</div>
		</div>
	</div>
</div>

<form id="curr_frm" method="post" action="<?=BASEURL?>admin/currency.php?act=new" style="display: none;">
<input id="curr_id" name="curr_id" type="hidden">
<label for="curr_name">name</label>
<div class="stretch_input"><input id="curr_name" name="curr_name" type="text"></div>
<label for="curr_sign">sign</label>
<div class="stretch_input"><input id="curr_sign" name="curr_sign" type="text"></div>
<div class="check_wr"><input id="curr_format" name="curr_format" type="checkbox"><label for="curr_format">sign before value</label></div>
<input class="adm_act_btn" type="submit" value="ok">
</form>
</body>
</html>
