<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
var currency = <?=f_json_encode($currArr)?>;
var icons = <?=f_json_encode($icons)?>;
onReady(initTests);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include("./view/templates/header.tpl");	?>
		<div class="container">
			<div class="content">
				<div class="content_wrap tests_content">
					<div class="results">
						<div class="controls"><input id="startbtn" class="adm_act_btn" type="button" value="start"></div>
						<div class="tbl_container"><table><tbody id="restbl"></tbody></table></div>
					</div>
					<div class="ph"></div>
					<div class="testview"><iframe id="viewframe" src="http://jezve.net/money/"></div>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
