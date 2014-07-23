<?php	include("./templates/commonhdr.tpl");	?>
<?php	if (isMessageSet()) {		?>
<script>
	onReady(initMessage);
</script>
<?php	}	?>
</head>
<body>
<form method="post" action="./modules/createperson.php" onsubmit="return onNewPersonSubmit(this);">
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<h2>Create new person</h2>
					<div>
						<div class="non_float std_margin">
							<label for="pname">Person name</label>
							<div class="stretch_input std_input"><div><input id="pname" name="pname" type="text"></div></div>
						</div>

						<div class="acc_controls"><input class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="./person.php">cancel</a></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</form>
</body>
</html>