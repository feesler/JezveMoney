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
						<h1>Transactions</h1>
						<div id="add_btn" class="iconlink"><a href="<?=BASEURL?>transactions/new/"><span class="icon"><?=svgIcon("plus")?></span><span class="icontitle"><span>New</span></span></a></div>
					</div>

					<div>
						<div class="trtype-menu trtype-menu-multi">
<?php	foreach($transMenu as $menuItem) {
			if ($menuItem->selected) {		?>
							<span class="trtype-menu_item trtype-menu_selected-item" data-type="<?=e($menuItem->type)?>">
<?php		} else {		?>
							<span class="trtype-menu_item" data-type="<?=e($menuItem->type)?>">
<?php		}
			if ($menuItem->type != 0) {		?>
								<span class="trtype-menu_item-check"><?=svgIcon("check")?></span>
<?php		}				?>
								<span class="trtype-menu_item_title">
									<a href="<?=e($menuItem->url)?>"><?=e($menuItem->title)?></a>
								</span>
							</span>
<?php	}			?>
						</div>

						<div class="std_margin filters-container">
							<div class="filter-item">
								<div>
									<select id="acc_id" name="acc_id" multiple>
										<option value="0">All</option>
<?php	foreach($accArr as $accData) {
			if (in_array($accData->id, $accFilter)) {		?>
										<option value="<?=e($accData->id)?>" selected><?=e($accData->name)?></option>
<?php		} else {		?>
										<option value="<?=e($accData->id)?>"><?=e($accData->name)?></option>
<?php		}
		}
		foreach($hiddenAccArr as $accData) {
			if (in_array($accData->id, $accFilter)) {		?>
										<option value="<?=e($accData->id)?>" selected><?=e($accData->name)?></option>
<?php		} else {		?>
										<option value="<?=e($accData->id)?>"><?=e($accData->name)?></option>
<?php		}
		}	?>
									</select>
								</div>
							</div>

							<div class="filter-item">
<?php if (is_empty($dateFmt)) {		?>
								<div id="calendar_btn" class="iconlink"><button type="button"><span class="icon"><?=svgIcon("cal")?></span><span class="icontitle"><span>Select range</span></span></button></div>
<?php } else {	?>
								<div id="calendar_btn" class="iconlink"><button type="button"><span class="icon"><?=svgIcon("cal")?></span><span class="icontitle"><span class="maintitle">Select range</span><span class="subtitle"><?=e($dateFmt)?></span></span></button></div>
<?php }		?>
								<div id="date_block" class="hidden">
									<div class="input-group">
										<div class="stretch_input rbtn_input">
											<input id="date" name="date" type="text" value="<?=e($dateFmt)?>">
										</div>
										<button id="cal_rbtn" class="btn icon_btn cal_btn" type="button"><?=svgIcon("cal")?></button>
										<div id="calendar"></div>
									</div>
								</div>
							</div>

							<div class="filter-item search-filter-item">
								<form id="searchFrm" method="get" action="<?=BASEURL?>transactions/">
								<div class="input-group search-form">
									<div class="stretch_input rbtn_input">
										<input id="search" name="search" type="text" value="<?=(is_null($searchReq) ? "" : e($searchReq))?>">
									</div>
									<button class="btn icon_btn search_btn" type="submit"><?=svgIcon("search")?></button>
								</div>
								</form>
							</div>
						</div>

<?php
	include(TPL_PATH."trlist.tpl");
?>
					</div>
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
						<div id="del_btn" class="iconlink hidden"><button type="button"><span class="icon icon_white"><?=svgIcon("del")?></span><span class="icontitle"><span>Delete</span></span></button></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<form id="delform" method="post" action="<?=BASEURL?>transactions/del/">
<input id="deltrans" name="transactions" type="hidden" value="">
</form>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>
	var accounts = <?=JSON::encode($accArr)?>;
	var currency = <?=JSON::encode($currArr)?>;
	var transArr = <?=JSON::encode($transArr)?>;
	var filterObj = <?=JSON::encode($filterObj)?>;

	onReady(initTransListDrag);
	onReady(initToolbar);
</script>
</body>
</html>
