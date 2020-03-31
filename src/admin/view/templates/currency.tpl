<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h2>Currencies</h2>

					<table id="currencies_tbl" class="adm_tbl">
						<thead>
							<tr><th>id</th><th>name</th><th>sign</th><th>format</th></tr>
						</thead>
						<tbody id="curr_list">
<?php	foreach($currArr as $currInfo) {		?>
							<tr>
								<td><?=e($currInfo->id)?></td>
								<td><?=e($currInfo->name)?></td>
								<td><?=e($currInfo->sign)?></td>
								<td><?=e($currInfo->format)?></td>
							</tr>
<?php	}	?>
						</tbody>
					</table>

					<div class="acc_controls">
						<input class="adm_act_btn" type="button" value="new" onclick="newCurr()">
						<input id="updbtn" class="adm_act_btn" type="button" value="update" style="display: none;">
						<input id="del_btn" class="adm_act_btn" type="button" value="delete" onclick="deleteCurr()" style="display: none;">
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<form id="curr_frm" method="post" action="<?=BASEURL?>api/currency/new" style="display: none;">
<input id="curr_id" name="id" type="hidden">
<div class="non_float">
	<label for="curr_name">Name</label>
	<div class="stretch_input"><input id="curr_name" name="name" type="text"></div>
</div>
<div class="non_float">
	<label for="curr_sign">Sign</label>
	<div class="stretch_input"><input id="curr_sign" name="sign" type="text"></div>
</div>
<div id="admin_block" class="non_float">
	<div id="admin_block" class="check_wr">
		<label for="isbefore"><input id="isbefore" name="format" type="radio" value="1">Sign before value</label>
	</div>
	<div id="admin_block" class="check_wr">
		<label for="isafter"><input id="isafter" name="format" type="radio" value="0">Sign after value</label>
	</div>
</div>
<div class="popup_form_controls">
	<input class="btn ok_btn" type="submit" value="Submit">
</div>
</form>

<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>

<script>
	var currency = <?=JSON::encode($currArr)?>;

	onReady(initControls);
</script>
</body>
</html>
