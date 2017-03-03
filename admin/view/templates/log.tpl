<?php	include("./view/templates/commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include("./view/templates/header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h2>Log</h2>

					<form method="post" action="./cleanlog.php">
					<input name="clean" type="hidden" value="1">
					<div class="acc_controls">
						<input class="adm_act_btn" type="submit" value="Clean log">
					</div>
					</form>
					<textarea rows="30" cols="150"><?=$contents?></textarea>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>