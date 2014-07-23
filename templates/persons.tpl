<?php	include("./templates/commonhdr.tpl");	?>
<link rel="stylesheet" media="all and (min-width: 701px)" type="text/css" href="./css/screen.css" />
<?php	if (isMessageSet()) {		?>
<script>
	onReady(initMessage);
</script>
<?php	}	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");	?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="heading">
						<h1>Persons</h1>
						<div id="add_btn" class="iconlink"><a href="./newperson.php"><span class="icon add"></span><span class="icontitle"><span>New</span></span></a></div>
					</div>
					<div class="tiles"><?php
		if (count($persArr)) {
			foreach($persArr as $pData) {
?><div id="p_<?=$pData[0]?>" class="tile"><button class="tilelink" onclick="onTileClick(<?=$pData[0]?>);" type="button"><span><span class="acc_bal"></span><span class="acc_name"><?=$pData[1]?></span></span></button></div><?php
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
			<div id="tb_content" class="siderbar_content">
				<div id="sbEllipsis" class="sidebar_ellipsis"></div>
				<div id="edit_btn" class="iconlink" style="display: none;"><a><span class="icon icon_white edit"></span><span class="icontitle"><span>Edit</span></span></a></div>
				<div id="del_btn" class="iconlink" style="display: none;"><button onclick="showDeletePopup();" type="button"><span class="icon icon_white del"></span><span class="icontitle"><span>Delete</span></span></button></div>
			</div>
		</div>
	</div>
</div>
<form id="delform" method="post" action="./modules/delperson.php">
<input id="delpersons" name="persons" type="hidden" value="">
</form>
</body>
</html>
