<?php	include("./view/templates/commonhdr.tpl");	?>
<link rel="stylesheet" media="all and (min-width: 701px)" type="text/css" href="<?=BASEURL?>view/css/screen.css" />
<script>
	onReady(initToolbar);
	onReady(initAccListControls);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./view/templates/header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1>Accounts</h1>
						<div id="add_btn" class="iconlink"><a href="<?=BASEURL?>accounts/new/"><span class="icon add"></span><span class="icontitle"><span>New</span></span></a></div>
					</div>
					<div id="tilesContainer" class="tiles"><?php
	if (count($tilesArr)) {
		foreach($tilesArr as $acc_id => $tile) {
?><div id="acc_<?=$acc_id?>" class="tile<?=$tile["icon"]?>"><button class="tilelink" type="button"><span><span class="acc_bal"><?=$tile["balance"]?></span><span class="acc_name"><?=$tile["name"]?></span></span></button></div><?php
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
					<div id="sbEllipsis" class="sidebar_ellipsis"></div>
					<div id="sbButtons" class="sidebar_buttons">
						<div id="edit_btn" class="iconlink" style="display: none;"><a><span class="icon icon_white edit"></span><span class="icontitle"><span>Edit</span></span></a></div>
						<div id="export_btn" class="iconlink" style="display: none;"><a><span class="icon icon_white export"></span><span class="icontitle"><span>Export to CSV</span></span></a></div>
						<div id="del_btn" class="iconlink" style="display: none;"><button type="button"><span class="icon icon_white del"></span><span class="icontitle"><span>Delete</span></span></button></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<form id="delform" method="post" action="<?=BASEURL?>accounts/del/">
<input id="delaccounts" name="accounts" type="hidden" value="">
</form>
</body>
</html>
