<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1>Accounts</h1>
						<div id="add_btn" class="iconlink"><a href="<?=BASEURL?>accounts/new/"><span class="icon"><?=svgIcon("plus")?></span><span class="icontitle"><span>New</span></span></a></div>
					</div>
					<div id="tilesContainer" class="tiles"><?php
	if (count($tilesArr)) {
		foreach($tilesArr as $acc_id => $tile) {
?><div id="acc_<?=e($acc_id)?>" class="tile<?=e($tile["icon"])?>"><button class="tilelink" type="button"><span><span class="acc_bal"><?=e($tile["balance"])?></span><span class="acc_icon"><?=useIcon("tile-".$tile["iconname"], 60, 54)?></span><span class="acc_name"><?=e($tile["name"])?></span></span></button></div><?php
		}
	} else {	?>
						<span>You have no one account. Please create one.</span>
<?php
	}
?></div>
				</div>
			</div>
		</div>
	</div>
	<div id="toolbar" class="sidebar" style="display: none;">
		<div>
			<div class="siderbar_content">
				<div id="tb_content">
					<div id="sbEllipsis" class="sidebar_ellipsis"><?=svgIcon("sbellipsis")?></div>
					<div id="sbButtons" class="sidebar_buttons">
						<div id="edit_btn" class="iconlink" style="display: none;"><a><span class="icon icon_white"><?=svgIcon("edit")?></span><span class="icontitle"><span>Edit</span></span></a></div>
						<div id="export_btn" class="iconlink" style="display: none;"><a><span class="icon icon_white"><?=svgIcon("export")?></span><span class="icontitle"><span>Export to CSV</span></span></a></div>
						<div id="del_btn" class="iconlink" style="display: none;"><button type="button"><span class="icon icon_white"><?=svgIcon("del")?></span><span class="icontitle"><span>Delete</span></span></button></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<form id="delform" method="post" action="<?=BASEURL?>accounts/del/">
<input id="delaccounts" name="accounts" type="hidden" value="">
</form>
<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
<script>
	onReady(initToolbar);
	onReady(initAccListControls);
</script>
</body>
</html>
