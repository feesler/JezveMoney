<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1><?=e($headString)?></h1>
<?php	if ($action == "edit") {		?>
						<div id="del_btn" class="iconlink"><button type="button"><span class="iconlink__icon"><?=svgIcon("del")?></span><span class="iconlink__content"><span>Delete</span></span></button></div>
<?php	}	?>
					</div>
					<div>
						<form id="personForm" method="post" action="<?=e(BASEURL."persons/".$action)?>/">
<?php	if ($action == "edit") {		?>
						<input id="pid" name="id" type="hidden" value="<?=e($p_id)?>">
<?php	}	?>
						<div id="name-inp-block" class="validation-block view-row std_margin">
							<label for="pname">Person name</label>
							<div class="stretch-input std_margin">
								<input id="pname" name="name" type="text" value="<?=e($pInfo->name)?>">
							</div>
							<div class="invalid-feedback">Please input name of person.</div>
						</div>

						<div class="acc_controls"><input class="btn submit-btn" type="submit" value="ok"><a class="btn cancel-btn" href="<?=BASEURL?>persons/">cancel</a></div>
						<input id="flags" name="flags" type="hidden" value="<?=e($pInfo->flags)?>">
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<?php	if ($action == "edit") {		?>
<form id="delform" method="post" action="<?=BASEURL?>persons/del/">
<input name="persons" type="hidden" value="<?=e($p_id)?>">
</form>
<?php	}	?>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>
	var person_id = <?=$p_id?>;
	var personName = <?=JSON::encode($pInfo->name)?>;

	onReady(initControls);
</script>
</body>
</html>