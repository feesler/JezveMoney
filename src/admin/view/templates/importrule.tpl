<?php
    use JezveMoney\Core\JSON;
?>
<?php   include(ADMIN_TPL_PATH."commonhdr.tpl");    ?>
</head>
<body>
<div class="page">
    <div class="page_wrapper">
<?php   include(ADMIN_TPL_PATH."header.tpl");   ?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>Import rules</h2>

                    <div class="row-container">
                        <div>
                            <table class="admin-tbl">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User ID</th>
                                        <th>Parent Rule ID</th>
                                        <th>Field</th>
                                        <th>Operator</th>
                                        <th>Value</th>
                                        <th>Flags</th>
                                    </tr>
                                </thead>
                                <tbody id="items-list">
<?php   foreach($itemsData as $item) {  ?>
                                    <tr data-id=<?=e($item->id)?>>
                                        <td><?=e($item->id)?></td>
                                        <td><?=e($item->user_id)?></td>
                                        <td><?=e($item->parent_id)?></td>
                                        <td><?=e($item->fieldName)?></td>
                                        <td><?=e($item->operatorName)?></td>
                                        <td><?=e($item->valueStr)?></td>
                                        <td><?=e($item->flags)?></td>
                                    </tr>
<?php   }   ?>
                                </tbody>
                            </table>

                            <div class="acc_controls">
                                <input id="createbtn" class="adm_act_btn" type="button" value="new">
                                <input id="updbtn" class="adm_act_btn hidden" type="button" value="update">
                                <input id="del_btn" class="adm_act_btn hidden" type="button" value="delete">
                            </div>
                        </div>

                        <div id="actionsContainer" class="hidden">
                            <table class="admin-tbl">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User ID</th>
                                        <th>Rule ID</th>
                                        <th>Action</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody id="actions-list">
                                </tbody>
                            </table>

                            <div class="acc_controls">
                                <input id="createactbtn" class="adm_act_btn" type="button" value="new">
                                <input id="updactbtn" class="adm_act_btn hidden" type="button" value="update">
                                <input id="delactbtn" class="adm_act_btn hidden" type="button" value="delete">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<form id="item-frm" class="hidden" method="post" action="<?=BASEURL?>api/importtpl/new">
<input id="item_id" name="id" type="hidden">
<div class="view-row">
    <label for="item_parent">Parent Rule ID</label>
    <div class="stretch-input"><input id="item_parent" name="parent_id" type="text" autocomplete="off"></div>
</div>

<div class="view-row">
    <label for="item_field_id">Field</label>
    <select id="item_field_id" class="admin-select" name="field_id">
        <option value="0">Select field type</option>
<?php   foreach($fieldsData as $field) {   ?>
        <option value="<?=e($field->id)?>"><?=e($field->name)?></option>
<?php   }   ?>
    </select>
</div>

<div class="view-row">
    <label for="item_operator">Operator</label>
    <select id="item_operator" class="admin-select" name="operator">
        <option value="0">Select operator</option>
<?php   foreach($operatorsData as $operator) {   ?>
        <option value="<?=e($operator->id)?>"><?=e($operator->name)?></option>
<?php   }       ?>
    </select>
</div>

<div class="view-row">
    <div class="checkbox-wrap">
        <label for="fieldflagcheck"><input id="fieldflagcheck" type="checkbox">Compare with field value</label>
    </div>
</div>

<div id="value_row" class="view-row">
    <label for="item_value">Value</label>
    <div class="stretch-input"><input id="item_value" type="text" autocomplete="off"></div>
</div>

<div id="fieldvalue_row" class="view-row">
    <label for="item_fieldvalue">Field</label>
    <select id="item_fieldvalue" class="admin-select">
        <option value="0">Select field</option>
<?php   foreach($fieldsData as $field) {   ?>
        <option value="<?=e($field->id)?>"><?=e($field->name)?></option>
<?php   }   ?>
    </select>
</div>

<div class="popup__form-controls">
    <input class="btn submit-btn" type="submit" value="Submit">
</div>
</form>

<form id="action-frm" class="hidden" method="post" action="<?=BASEURL?>api/importtpl/new">
<input id="action_id" name="id" type="hidden">
<div class="view-row">
    <label for="item_rule">Rule ID</label>
    <div class="stretch-input"><input id="action_rule" name="rule_id" type="text" autocomplete="off"></div>
</div>

<div class="view-row">
    <label for="action_type_id">Action type</label>
    <select id="action_type_id" class="admin-select" name="action_id">
        <option value="0">Select action type</option>
<?php   foreach($actTypeData as $item) {   ?>
        <option value="<?=e($item->id)?>"><?=e($item->name)?></option>
<?php   }   ?>
    </select>
</div>

<div class="view-row">
    <label for="item_value">Value</label>
    <div class="stretch-input"><input id="action_value" name="value" type="text" autocomplete="off"></div>
</div>

<div class="popup__form-controls">
    <input class="btn submit-btn" type="submit" value="Submit">
</div>
</form>

<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>

<script>
    var view = new AdminImportRuleListView({
        data: <?=JSON::encode($itemsData)?>,
        actionTypes: <?=JSON::encode($actTypeData)?>,
        fields: <?=JSON::encode($fieldsData)?>,
        operators: <?=JSON::encode($operatorsData)?>
    });
</script>
</body>
</html>
