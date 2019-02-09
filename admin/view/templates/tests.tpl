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
		<div class="container">
			<div class="content">
				<div class="content_wrap tests_content">
					<div class="results">
						<input id="startbtn" class="adm_act_btn" type="button" value="start">
						<table><tbody id="restbl"></tbody></table>
					</div>
					<div class="testview"><iframe id="viewframe" src="http://jezve.net/money/"></div>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
