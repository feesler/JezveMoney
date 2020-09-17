<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h2>Icons</h2>

					<table id="icons_tbl" class="admin-tbl">
						<thead>
							<tr><th>id</th><th>name</th><th>file</th><th>type</th></tr>
						</thead>
						<tbody id="icons_list">
<?php	foreach($itemsData as $item) {		?>
							<tr>
								<td><?=e($item->id)?></td>
								<td><?=e($item->name)?></td>
								<td><?=e($item->file)?></td>
								<td><?=e($item->type)?></td>
							</tr>
<?php	}	?>
						</tbody>
					</table>

					<div class="acc_controls">
						<input id="createbtn" class="adm_act_btn" type="button" value="new">
						<input id="updbtn" class="adm_act_btn hidden" type="button" value="update">
						<input id="del_btn" class="adm_act_btn hidden" type="button" value="delete">
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<form id="icon_frm" class="hidden" method="post" action="<?=BASEURL?>api/icon/new">
<input id="icon_id" name="id" type="hidden">
<div class="view-row">
	<label for="icon_name">Name</label>
	<div class="stretch-input"><input id="icon_name" name="name" type="text"></div>
</div>
<div class="view-row">
	<label for="icon_file">File name</label>
	<div class="stretch-input"><input id="icon_file" name="file" type="text"></div>
</div>
<div id="admin_block" class="view-row">
	<label for="icon_type">Type</label>
	<div class="stretch-input">
		<select id="icon_type" name="type">
			<option value="0">Select type</option>
<?php	foreach($typesData as $type_id => $typeName) {		?>
			<option value="<?=e($type_id)?>"><?=e($typeName)?></option>
<?php	}		?>
		</select>
	</div>
</div>
<div class="popup__form-controls">
	<input class="btn submit-btn" type="submit" value="Submit">
</div>
</form>

<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>

<script>
	var itemsData = <?=JSON::encode($itemsData)?>;

	onReady(initControls);
</script>
</body>
</html>
