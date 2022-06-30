<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
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
                        <input id="createbtn" class="adm_act_btn" type="button" value="create">
                        <input id="updbtn" class="adm_act_btn hidden" type="button" value="update">
                        <input id="del_btn" class="adm_act_btn hidden" type="button" value="delete">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<form id="item-frm" class="hidden" method="post" action="<?=BASEURL?>api/importtpl/create">
    <input id="item_id" name="id" type="hidden">
    <div class="view-row">
        <label for="item_name">Name</label>
        <input id="item_name" class="stretch-input" name="name" type="text">
    </div>
    <div class="view-row">
        <label for="item_type_id">Type id</label>
        <input id="item_type_id" class="stretch-input" name="type_id" type="text" autocomplete="off">
    </div>
    <div class="view-row">
        <label for="item_date_col">Date column index</label>
        <input id="item_date_col" class="stretch-input" name="date_col" type="text" autocomplete="off">
    </div>
    <div class="view-row">
        <label for="item_comment_col">Comment column index</label>
        <input id="item_comment_col" class="stretch-input" name="comment_col" type="text" autocomplete="off">
    </div>
    <div class="view-row">
        <label for="item_trans_curr_col">Currency of transaction column index</label>
        <input id="item_trans_curr_col" class="stretch-input" name="trans_curr_col" type="text" autocomplete="off">
    </div>
    <div class="view-row">
        <label for="item_trans_amount_col">Amount of transaction column index</label>
        <input id="item_trans_amount_col" class="stretch-input" name="trans_amount_col" type="text" autocomplete="off">
    </div>
    <div class="view-row">
        <label for="item_account_curr_col">Currency of account column index</label>
        <input id="item_account_curr_col" class="stretch-input" name="account_curr_col" type="text" autocomplete="off">
    </div>
    <div class="view-row">
        <label for="item_account_amount_col">Amount of account column index</label>
        <input id="item_account_amount_col" class="stretch-input" name="account_amount_col" type="text" autocomplete="off">
    </div>
    <div class="popup__form-controls">
        <input class="btn submit-btn" type="submit" value="Submit">
    </div>
</form>

<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>
</body>
</html>
