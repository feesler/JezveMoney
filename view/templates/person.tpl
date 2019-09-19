<?php	include("./view/templates/commonhdr.tpl");	?>
<?php	if ($action == "edit") {		?>
<script>
	var person_id = <?=$p_id?>;
	var personName = <?=f_json_encode($pName)?>;

	onReady(initControls);
</script>
<?php	}	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./view/templates/header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1><?=$headString?></h1>
<?php	if ($action == "edit") {		?>
						<div id="del_btn" class="iconlink"><button type="button"><span class="icon del"></span><span class="icontitle"><span>Delete</span></span></button></div>
<?php	}	?>
					</div>
					<div>
						<form id="personForm" method="post" action="<?=BASEURL?>persons/<?=$action?>/">
<?php	if ($action == "edit") {		?>
						<input id="pid" name="pid" type="hidden" value="<?=$p_id?>">
<?php	}	?>
						<div class="non_float std_margin">
							<label for="pname">Person name</label>
							<div class="stretch_input std_input">
								<input id="pname" name="pname" type="text" value="<?=$pName?>">
							</div>
						</div>

						<div class="acc_controls"><input class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="<?=BASEURL?>persons/">cancel</a></div>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<?php	if ($action == "edit") {		?>
<form id="delform" method="post" action="<?=BASEURL?>persons/del/">
<input name="persons" type="hidden" value="<?=$p_id?>">
</form>
<?php	}	?>
</body>
</html>