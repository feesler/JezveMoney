<?php	include("./templates/commonhdr.tpl");	?>
<?php	if ($action == "edit") {		?>
<script>
	var person_id = <?=$p_id?>;
	var personName = <?=f_json_encode($pName)?>;
</script>
<?php	}	?>
</head>
<body>
<form method="post" action="./modules/person.php?act=<?=$action?>" onsubmit="<?=$submitHandler?>">
<?php	if ($action == "edit") {		?>
<input id="pid" name="pid" type="hidden" value="<?=$p_id?>">
<?php	}	?>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading h2_heading">
						<h2><?=$headString?></h2>
<?php	if ($action == "edit") {		?>
						<div id="del_btn" class="iconlink"><button onclick="onDelete();" type="button"><span class="icon del"></span><span class="icontitle"><span>Delete</span></span></button></div>
<?php	}	?>
					</div>
					<div>
						<div class="non_float std_margin">
							<label for="pname">Person name</label>
							<div class="stretch_input std_input">
								<div><input id="pname" name="pname" type="text" value="<?=$pName?>"></div>
							</div>
						</div>

						<div class="acc_controls"><input class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="./person.php">cancel</a></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</form>
<?php	if ($action == "edit") {		?>
<form id="delform" method="post" action="./modules/person.php?act=del">
<input name="persons" type="hidden" value="<?=$p_id?>">
</form>
<?php	}	?>
</body>
</html>