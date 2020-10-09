<?php
    use JezveMoney\Core\JSON;
?>
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
                        <div id="add_btn" class="iconlink">
                            <a href="<?=BASEURL?>accounts/new/">
                                <span class="iconlink__icon"><?=svgIcon("plus")?></span>
                                <span class="iconlink__content"><span>New</span></span>
                            </a>
                        </div>
                    </div>
                    <div id="tilesContainer" class="tiles">
<?php   if (count($tilesArr)) {     ?>
<?php		foreach($tilesArr as $acc_id => $tile) {    ?>
                        <div class="tile" data-id="<?=e($acc_id)?>">
                            <button class="tilelink" type="button">
                                <span>
                                    <span class="tile__subtitle"><?=e($tile["balance"])?></span>
                                    <span class="tile__icon"><?=useIcon($tile["icon"], 60, 54)?></span>
                                    <span class="tile__title"><?=e($tile["name"])?></span>
                                </span>
                            </button>
                        </div>
<?php       }   ?>
<?php	} else {	?>
                        <span>You have no one account. Please create one.</span>
<?php   }   ?>
                    </div>
<?php	if (count($hiddenTilesArr)) {	?>
                    <div class="heading">
                        <h1>Hidden</h1>
                    </div>
                    <div id="hiddenTilesContainer" class="tiles">
<?php       foreach($hiddenTilesArr as $acc_id => $tile) {  ?>
                        <div class="tile" data-id="<?=e($acc_id)?>">
                            <button class="tilelink" type="button">
                                <span>
                                    <span class="tile__subtitle"><?=e($tile["balance"])?></span>
                                    <span class="tile__icon"><?=useIcon($tile["icon"], 60, 54)?></span>
                                    <span class="tile__title"><?=e($tile["name"])?></span>
                                </span>
                            </button>
                        </div>
<?php       }   ?>
                    </div>
<?php	} else {	?>
                    <div id="hiddenTilesContainer" class="tiles hidden"></div>
<?php	}	?>
                </div>
            </div>
        </div>
    </div>
    <div id="toolbar" class="sidebar hidden">
        <div>
            <div class="siderbar__content">
                <div id="tb_content">
                    <div id="sbEllipsis" class="sidebar__ellipsis"><?=svgIcon("sbellipsis")?></div>
                    <div id="sbButtons" class="sidebar__controls">
                        <div id="edit_btn" class="iconlink hidden">
                            <a>
                                <span class="iconlink__icon sidebar-icon"><?=svgIcon("edit")?></span>
                                <span class="iconlink__content"><span>Edit</span></span>
                            </a>
                        </div>
                        <div id="export_btn" class="iconlink hidden">
                            <a>
                                <span class="iconlink__icon sidebar-icon"><?=svgIcon("export")?></span>
                                <span class="iconlink__content"><span>Export to CSV</span></span>
                            </a>
                        </div>
                        <div id="show_btn" class="iconlink hidden">
                            <button type="button">
                                <span class="iconlink__icon sidebar-icon"><?=svgIcon("show")?></span>
                                <span class="iconlink__content"><span>Restore</span></span>
                            </button>
                        </div>
                        <div id="hide_btn" class="iconlink hidden">
                            <button type="button">
                                <span class="iconlink__icon sidebar-icon"><?=svgIcon("hide")?></span>
                                <span class="iconlink__content"><span>Hide</span></span>
                            </button>
                        </div>
                        <div id="del_btn" class="iconlink hidden">
                            <button type="button">
                                <span class="iconlink__icon sidebar-icon"><?=svgIcon("del")?></span>
                                <span class="iconlink__content"><span>Delete</span></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<form id="showform" method="post" action="<?=BASEURL?>accounts/show/">
<input id="showaccounts" name="accounts" type="hidden" value="">
</form>
<form id="hideform" method="post" action="<?=BASEURL?>accounts/hide/">
<input id="hideaccounts" name="accounts" type="hidden" value="">
</form>
<form id="delform" method="post" action="<?=BASEURL?>accounts/del/">
<input id="delaccounts" name="accounts" type="hidden" value="">
</form>
<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
<script>
    onReady(initToolbar);

    var view = new AccountListView({
        accounts: <?=JSON::encode($accountsData)?>
    });
</script>
</body>
</html>
