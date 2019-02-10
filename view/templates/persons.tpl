<?php	include("./view/templates/commonhdr.tpl");	?>
<link rel="stylesheet" media="all and (min-width: 701px)" type="text/css" href="<?=BASEURL?>view/css/screen.css" />
<script>
	onReady(initPersonsList);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./view/templates/header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1>Persons</h1>
						<div id="add_btn" class="iconlink"><a href="<?=BASEURL?>persons/new/"><span class="icon add"></span><span class="icontitle"><span>New</span></span></a></div>
					</div>
					<div class="tiles"><?php
		if (count($persArr)) {
			foreach($persArr as $pData) {
?><div id="p_<?=$pData->id?>" class="tile"><button class="tilelink" onclick="onTileClick(<?=$pData->id?>);" type="button"><span><span class="acc_bal"></span><span class="acc_name"><?=$pData->name?></span></span></button></div><?php
			}
		} else {	?>
						<span>You have no one person. Please create one.</span>
<?php	}	?></div>
				</div>
			</div>
		</div>
	</div>

	<div id="toolbar" class="sidebar" style="display: none;">
		<div>
			<div class="siderbar_content">
				<div id="tb_content">
					<div id="sbEllipsis" class="sidebar_ellipsis"></div>
					<div id="sbButtons" class="sidebar_buttons">
						<div id="edit_btn" class="iconlink" style="display: none;"><a><span class="icon icon_white edit"></span><span class="icontitle"><span>Edit</span></span></a></div>
						<div id="del_btn" class="iconlink" style="display: none;"><button onclick="showDeletePopup();" type="button"><span class="icon icon_white del"></span><span class="icontitle"><span>Delete</span></span></button></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<form id="delform" method="post" action="<?=BASEURL?>persons/del/">
<input id="delpersons" name="persons" type="hidden" value="">
</form>
</body>
</html>
