<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>Currencies</h2>

                    <table class="admin-tbl">
                        <thead>
                            <tr><th>id</th><th>name</th><th>sign</th><th>flags</th></tr>
                        </thead>
                        <tbody id="items-list">
<?php	foreach($itemsData as $currInfo) {		?>
                            <tr data-id=<?=e($currInfo->id)?>>
                                <td><?=e($currInfo->id)?></td>
                                <td><?=e($currInfo->name)?></td>
                                <td><?=e($currInfo->sign)?></td>
                                <td><?=e($currInfo->flags)?></td>
                            </tr>
<?php	}	?>
                        </tbody>
                    </table>

                    <div class="form-controls">
                        <input id="createbtn" class="adm_act_btn" type="button" value="create">
                        <input id="updbtn" class="adm_act_btn" type="button" value="update" hidden>
                        <input id="del_btn" class="adm_act_btn" type="button" value="delete" hidden>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<form id="item-frm" method="post" action="<?=BASEURL?>api/currency/create" hidden>
    <input id="curr_id" name="id" type="hidden">
    <div class="view-row">
        <label for="curr_name">Name</label>
        <input id="curr_name" class="stretch-input" name="name" type="text">
    </div>
    <div class="view-row">
        <label for="curr_sign">Sign</label>
        <input id="curr_sign" class="stretch-input" name="sign" type="text">
    </div>
    <div id="admin_block" class="view-row">
        <div id="admin_block" class="checkbox-wrap">
            <label for="isbefore"><input id="isbefore" name="flags" type="radio" value="1">Sign before value</label>
        </div>
        <div id="admin_block" class="checkbox-wrap">
            <label for="isafter"><input id="isafter" name="flags" type="radio" value="0">Sign after value</label>
        </div>
    </div>
    <div class="popup__form-controls">
        <input class="btn submit-btn" type="submit" value="Submit">
    </div>
</form>

<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>
</body>
</html>
