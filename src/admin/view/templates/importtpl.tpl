<?php
    use JezveMoney\Core\JSON;
?>
<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
    <div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>Import templates</h2>

                    <table class="admin-tbl">
                        <thead>
                            <tr>
                                <th rowspan="2">ID</th>
                                <th rowspan="2">Name</th>
                                <th rowspan="2">Type</th>
                                <th colspan="6">Column indexes</th>
                            </tr>
                            <tr>
                                <th>Date</th>
                                <th>Comment</th>
                                <th>Currency of transaction</th>
                                <th>Amount of transaction</th>
                                <th>Currency of account</th>
                                <th>Amount of account</th>
                            </tr>
                        </thead>
                        <tbody id="items-list">
<?php	foreach($itemsData as $item) {		?>
                            <tr data-id=<?=e($item->id)?>>
                                <td><?=e($item->id)?></td>
                                <td><?=e($item->name)?></td>
                                <td><?=e($item->type_id)?></td>
                                <td><?=e($item->columns["date"])?></td>
                                <td><?=e($item->columns["comment"])?></td>
                                <td><?=e($item->columns["transactionCurrency"])?></td>
                                <td><?=e($item->columns["transactionAmount"])?></td>
                                <td><?=e($item->columns["accountCurrency"])?></td>
                                <td><?=e($item->columns["accountAmount"])?></td>
                            </tr>
<?php	}	?>
                        </tbody>
                    </table>

                    <div class="acc_controls">
                        <input id="createbtn" class="adm_act_btn" type="button" value="new">
                        <input id="updbtn" class="adm_act_btn hidden" type="button" value="update">
                        <input id="del_btn" class="adm_act_btn hidden" type="button" value="delete">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<form id="item-frm" class="hidden" method="post" action="<?=BASEURL?>api/importtpl/new">
<input id="item_id" name="id" type="hidden">
<div class="view-row">
    <label for="item_name">Name</label>
    <div class="stretch-input"><input id="item_name" name="name" type="text"></div>
</div>
<div class="view-row">
    <label for="item_type_id">Type id</label>
    <div class="stretch-input"><input id="item_type_id" name="type_id" type="text" autocomplete="off"></div>
</div>
<div class="view-row">
    <label for="item_date_col">Date column index</label>
    <div class="stretch-input"><input id="item_date_col" name="date_col" type="text" autocomplete="off"></div>
</div>
<div class="view-row">
    <label for="item_comment_col">Comment column index</label>
    <div class="stretch-input"><input id="item_comment_col" name="comment_col" type="text" autocomplete="off"></div>
</div>
<div class="view-row">
    <label for="item_trans_curr_col">Currency of transaction column index</label>
    <div class="stretch-input"><input id="item_trans_curr_col" name="trans_curr_col" type="text" autocomplete="off"></div>
</div>
<div class="view-row">
    <label for="item_trans_amount_col">Amount of transaction column index</label>
    <div class="stretch-input"><input id="item_trans_amount_col" name="trans_amount_col" type="text" autocomplete="off"></div>
</div>
<div class="view-row">
    <label for="item_account_curr_col">Currency of account column index</label>
    <div class="stretch-input"><input id="item_account_curr_col" name="account_curr_col" type="text" autocomplete="off"></div>
</div>
<div class="view-row">
    <label for="item_account_amount_col">Amount of account column index</label>
    <div class="stretch-input"><input id="item_account_amount_col" name="account_amount_col" type="text" autocomplete="off"></div>
</div>
<div class="popup__form-controls">
    <input class="btn submit-btn" type="submit" value="Submit">
</div>
</form>

<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>

<script>
    var view = new AdminImportTemplateListView({
        data :  <?=JSON::encode($itemsData)?>
    });
</script>
</body>
</html>
