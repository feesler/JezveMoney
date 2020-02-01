<?php	include("./view/templates/commonhdr.tpl");	?>
<link rel="stylesheet" media="all and (min-width: 701px)" type="text/css" href="<?=BASEURL?>view/css/screen.css" />
<script>
	var accounts = <?=JSON::encode($accArr)?>;
	var currency = <?=JSON::encode($currArr)?>;
	var transArr = <?=JSON::encode($transArr)?>;
	var filterObj = <?=JSON::encode($filterObj)?>;

	onReady(initTransListDrag);
	onReady(initToolbar);
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
						<h1>Transactions</h1>
						<div id="add_btn" class="iconlink"><a href="<?=BASEURL?>transactions/new/"><span class="icon add"></span><span class="icontitle"><span>New</span></span></a></div>
					</div>

					<div class="clearfix">
						<div id="trtype_menu" class="subHeader">
<?php	forEach($transMenu as $menuItem) {
			if ($menuItem->ind == $trParams["type"]) {		?>
							<span><b><?=$menuItem->title?></b></span>
<?php		} else {		?>
							<span><a href="<?=$menuItem->url?>"><?=$menuItem->title?></a></span>
<?php		}
		}	?>
						</div>

						<div class="std_margin clearfix">
							<form id="searchFrm" method="get" action="<?=BASEURL?>transactions/">
							<div class="right_float">
								<button class="btn icon_btn search_btn right_float" type="submit"><span></span></button>
								<div class="stretch_input rbtn_input">
									<input id="search" name="search" type="text" value="<?=(is_null($searchReq) ? "" : $searchReq)?>">
								</div>
							</div>
							</form>

							<div class="tr_filter">
								<div>
									<select id="acc_id" name="acc_id" multiple>
										<option value="0">All</option>
<?php	foreach($accArr as $accData) {
			if (in_array($accData->id, $accFilter)) {		?>
										<option value="<?=$accData->id?>" selected><?=$accData->name?></option>
<?php		} else {		?>
										<option value="<?=$accData->id?>"><?=$accData->name?></option>
<?php		}
		}	?>
									</select>
								</div>
							</div>

							<div class="tr_filter date_filter">
<?php if (is_empty($dateFmt)) {		?>
								<div id="calendar_btn" class="iconlink"><button type="button"><span class="icon calendar"></span><span class="icontitle"><span>Select range</span></span></button></div>
<?php } else {	?>
								<div id="calendar_btn" class="iconlink"><button type="button"><span class="icon calendar"></span><span class="icontitle"><span class="maintitle">Select range</span><span class="subtitle"><?=$dateFmt?></span></span></button></div>
<?php }		?>
								<div id="date_block" style="display: none;">
									<div>
										<button id="cal_rbtn" class="btn icon_btn cal_btn right_float" type="button"><span></span></button>
										<div class="stretch_input rbtn_input">
											<input id="date" name="date" type="text" value="<?=$dateFmt?>">
										</div>
										<div id="calendar"></div>
									</div>
								</div>
							</div>
						</div>

<?php
	include("./view/templates/trlist.tpl");
?>
					</div>
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
						<div id="del_btn" class="iconlink" style="display: none;"><button type="button"><span class="icon icon_white del"></span><span class="icontitle"><span>Delete</span></span></button></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<form id="delform" method="post" action="<?=BASEURL?>transactions/del/">
<input id="deltrans" name="transactions" type="hidden" value="">
</form>
</body>
</html>
