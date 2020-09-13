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
						<h1>Persons</h1>
						<div id="add_btn" class="iconlink"><a href="<?=BASEURL?>persons/new/"><span class="icon"><?=svgIcon("plus")?></span><span class="icontitle"><span>New</span></span></a></div>
					</div>
					<div id="tilesContainer" class="tiles"><?php
		if (count($persArr)) {
			foreach($persArr as $pData) {
?><div id="p_<?=e($pData->id)?>" class="tile"><button class="tilelink" type="button"><span><span class="acc_bal"></span><span class="acc_name"><?=e($pData->name)?></span></span></button></div><?php
			}
		} else {	?>
						<span>You have no one person. Please create one.</span>
<?php	}	?></div>
<?php	if (count($hiddenPersArr)) {	?>
					<div class="heading">
						<h1>Hidden</h1>
					</div>
					<div id="hiddenTilesContainer" class="tiles"><?php
			foreach($hiddenPersArr as $pData) {
?><div id="p_<?=e($pData->id)?>" class="tile"><button class="tilelink" type="button"><span><span class="acc_bal"></span><span class="acc_name"><?=e($pData->name)?></span></span></button></div><?php
			}
?></div>
<?php	} else {	?>
					<div id="hiddenTilesContainer" class="tiles hidden"></div>
<?php	}	?>
				</div>
			</div>
		</div>
	</div>

	<div id="toolbar" class="sidebar hidden">
		<div>
			<div class="siderbar_content">
				<div id="tb_content">
					<div id="sbEllipsis" class="sidebar_ellipsis"><?=svgIcon("sbellipsis")?></div>
					<div id="sbButtons" class="sidebar_buttons">
						<div id="edit_btn" class="iconlink hidden"><a><span class="icon icon_white"><?=svgIcon("edit")?></span><span class="icontitle"><span>Edit</span></span></a></div>
						<div id="show_btn" class="iconlink hidden"><button type="button"><span class="icon icon_white"><?=svgIcon("show")?></span><span class="icontitle"><span>Restore</span></span></button></div>
						<div id="hide_btn" class="iconlink hidden"><button type="button"><span class="icon icon_white"><?=svgIcon("hide")?></span><span class="icontitle"><span>Hide</span></span></button></div>
						<div id="del_btn" class="iconlink hidden"><button type="button"><span class="icon icon_white"><?=svgIcon("del")?></span><span class="icontitle"><span>Delete</span></span></button></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<form id="showform" method="post" action="<?=BASEURL?>persons/show/">
<input id="showpersons" name="persons" type="hidden" value="">
</form>
<form id="hideform" method="post" action="<?=BASEURL?>persons/hide/">
<input id="hidepersons" name="persons" type="hidden" value="">
</form>
<form id="delform" method="post" action="<?=BASEURL?>persons/del/">
<input id="delpersons" name="persons" type="hidden" value="">
</form>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>
	onReady(initPersonsList);
</script>
</body>
</html>
