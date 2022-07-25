<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>Icons</h2>

                    <table class="admin-tbl">
                        <thead>
                            <tr><th>id</th><th>name</th><th>file</th><th>type</th></tr>
                        </thead>
                        <tbody id="items-list">
<?php	foreach($itemsData as $item) {		?>
                            <tr data-id=<?=e($item->id)?>>
                                <td><?=e($item->id)?></td>
                                <td><?=e($item->name)?></td>
                                <td><?=e($item->file)?></td>
                                <td><?=e($item->type)?></td>
                            </tr>
<?php	}	?>
                        </tbody>
                    </table>

                    <div class="acc_controls">
                        <input id="createbtn" class="adm_act_btn" type="button" value="create">
                        <input id="updbtn" class="adm_act_btn" type="button" value="update" hidden>
                        <input id="del_btn" class="adm_act_btn" type="button" value="delete" hidden>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<form id="item-frm" method="post" action="<?=BASEURL?>api/icon/create" hidden>
    <input id="icon_id" name="id" type="hidden">
    <div class="view-row">
        <label for="icon_name">Name</label>
        <input id="icon_name" class="stretch-input" name="name" type="text">
    </div>
    <div class="view-row">
        <label for="icon_file">File name</label>
        <input id="icon_file" class="stretch-input" name="file" type="text">
    </div>
    <div id="admin_block" class="view-row">
        <label for="icon_type">Type</label>
        <select id="icon_type" class="stretch-input admin-select" name="type">
            <option value="0">Select type</option>
    <?php	foreach($typesData as $type_id => $typeName) {		?>
            <option value="<?=e($type_id)?>"><?=e($typeName)?></option>
    <?php	}		?>
        </select>
    </div>
    <div class="popup__form-controls">
        <input class="btn submit-btn" type="submit" value="Submit">
    </div>
</form>

<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>
</body>
</html>
