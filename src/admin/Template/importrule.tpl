<?php   include(ADMIN_TPL_PATH."commonhdr.tpl");    ?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php   include(ADMIN_TPL_PATH."header.tpl");   ?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>Import rules</h2>
                    <div class="main-container">
                        <div class="list-view-container">
                            <table class="admin-tbl">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User ID</th>
                                        <th>Flags</th>
                                    </tr>
                                </thead>
                                <tbody id="items-list">
<?php   foreach($itemsData as $item) { ?>
                                    <tr data-id="<?=$item->id?>">
                                        <td><?=e($item->id)?></td>
                                        <td><?=e($item->user_id)?></td>
                                        <td><?=e($item->flags)?></td>
                                    </tr>
<?php   }   ?>
                                </tbody>
                            </table>

                            <div class="acc_controls">
                                <input id="createbtn" class="adm_act_btn" type="button" value="create">
                                <input id="updbtn" class="adm_act_btn hidden" type="button" value="update">
                                <input id="del_btn" class="adm_act_btn hidden" type="button" value="delete">
                            </div>
                        </div>


                        <div id="conditionsContainer" class="list-view-container hidden">
                            <h2>Import conditions</h2>
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
                                <tbody id="conditions-list"></tbody>
                            </table>

                            <div class="acc_controls">
                                <input id="createcondbtn" class="adm_act_btn" type="button" value="create">
                                <input id="updcondbtn" class="adm_act_btn hidden" type="button" value="update">
                                <input id="delcondbtn" class="adm_act_btn hidden" type="button" value="delete">
                            </div>
                        </div>

                        <div id="actionsContainer" class="list-view-container hidden">
                            <h2>Actions</h2>
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
                                <tbody id="actions-list"></tbody>
                            </table>

                            <div class="acc_controls">
                                <input id="createactbtn" class="adm_act_btn" type="button" value="create">
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

<form id="item-frm" class="hidden" method="post" action="<?=BASEURL?>api/importrule/create">
    <input id="item_id" name="id" type="hidden">
    <div class="view-row">
        <label for="item_flags">Flags</label>
        <input id="item_flags" class="stretch-input" name="flags" type="text" autocomplete="off">
    </div>

    <div class="popup__form-controls">
        <input class="btn submit-btn" type="submit" value="Submit">
    </div>
</form>

<form id="condition-frm" class="hidden" method="post" action="<?=BASEURL?>api/importcond/create">
    <input id="cond_id" name="id" type="hidden">
    <div class="view-row">
        <label for="cond_rule">Parent Rule ID</label>
        <input id="cond_rule" class="stretch-input" name="rule_id" type="text" autocomplete="off">
    </div>

    <div class="view-row">
        <label for="cond_field_id">Field</label>
        <select id="cond_field_id" class="stretch-input admin-select" name="field_id">
            <option value="0">Select field type</option>
<?php   foreach($fieldsData as $field) {   ?>
            <option value="<?=e($field->id)?>"><?=e($field->name)?></option>
<?php   }   ?>
        </select>
    </div>

    <div class="view-row">
        <label for="cond_operator">Operator</label>
        <select id="cond_operator" class="stretch-input admin-select" name="operator">
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
        <label for="cond_value">Value</label>
        <input id="cond_value" class="stretch-input" type="text" autocomplete="off">
    </div>

    <div id="fieldvalue_row" class="view-row">
        <label for="cond_fieldvalue">Field</label>
        <select id="cond_fieldvalue" class="stretch-input admin-select">
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

<form id="action-frm" class="hidden" method="post" action="<?=BASEURL?>api/importaction/create">
    <input id="action_id" name="id" type="hidden">
    <div class="view-row">
        <label for="item_rule">Rule ID</label>
        <input id="action_rule" class="stretch-input" name="rule_id" type="text" autocomplete="off">
    </div>

    <div class="view-row">
        <label for="action_type_id">Action type</label>
        <select id="action_type_id" class="stretch-input admin-select" name="action_id">
            <option value="0">Select action type</option>
<?php   foreach($actTypeData as $item) {   ?>
            <option value="<?=e($item->id)?>"><?=e($item->name)?></option>
<?php   }   ?>
        </select>
    </div>

    <div class="view-row">
        <label for="item_value">Value</label>
        <input id="action_value" class="stretch-input" name="value" type="text" autocomplete="off">
    </div>

    <div class="popup__form-controls">
        <input class="btn submit-btn" type="submit" value="Submit">
    </div>
</form>

<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>
</body>
</html>
