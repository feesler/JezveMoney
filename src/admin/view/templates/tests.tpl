<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>
		<div class="container">
			<div class="content">
				<div class="content_wrap tests_content">
					<div class="results">
						<div class="controls">
							<input id="startbtn" class="adm_act_btn" type="button" value="start">
							<table class="adm_tbl counter_tbl">
								<tr>
									<td class="title">Total</td><td id="totalRes"></td>
									<td class="title">Ok</td><td id="okRes"></td>
									<td class="title">Fail</td><td id="failRes"></td>
								</tr>
							</table>
						</div>
						<div class="tbl_container"><table><tbody id="restbl"></tbody></table></div>
					</div>
					<div class="ph"></div>
					<div class="testview"><iframe id="viewframe" src="<?=BASEURL?>"></iframe></div>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
