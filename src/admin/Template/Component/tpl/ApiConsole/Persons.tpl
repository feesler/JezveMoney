<div id="listPersonsForm" class="request-data-form">
    <h3>List persons</h3>
    <form action="<?= BASEURL ?>api/person/list" method="get">
        <div class="std_margin">
            <label class="checkbox">
                <input type="checkbox" data-target="visibility">
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label">Visibility</span>
            </label>
            <select class="stretch-input" name="visibility" disabled>
                <option value="all">All</option>
                <option value="visible" selected>Visible</option>
                <option value="hidden">Hidden</option>
            </select>
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readPersonForm" class="request-data-form">
    <h3>Read person</h3>
    <div class="std_margin">
        <label for="read_person_id">Id</label>
        <input id="read_person_id" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="readpersonbtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createPersonForm" class="request-data-form">
    <h3>Create person</h3>
    <form action="<?= BASEURL ?>api/person/create" method="post">
        <div class="std_margin">
            <label for="create_person_name">Name</label>
            <input id="create_person_name" class="stretch-input" name="name" type="text">
        </div>
        <div class="std_margin">
            <label for="create_person_flags">Flags (0 - person is visible; 1 - hidden)</label>
            <input id="create_person_flags" class="stretch-input" name="flags" type="text">
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="updatePersonForm" class="request-data-form">
    <h3>Update person</h3>
    <form action="<?= BASEURL ?>api/person/update" method="post">
        <div class="std_margin">
            <label for="update_person_id">Id</label>
            <input id="update_person_id" class="stretch-input" name="id" type="text">
        </div>
        <div class="std_margin">
            <label for="update_person_name">Name</label>
            <input id="update_person_name" class="stretch-input" name="name" type="text">
        </div>
        <div class="std_margin">
            <label for="update_person_flags">Flags (0 - person is visible; 1 - hidden)</label>
            <input id="update_person_flags" class="stretch-input" name="flags" type="text">
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="delPersonForm" class="request-data-form">
    <h3>Delete persons</h3>
    <div class="std_margin">
        <label for="delpersons">Persons (comma separated ids)</label>
        <input id="delpersons" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="delpersonbtn" class="btn submit-btn" type="submit" value="Submit">
    </div>
</div>

<div id="setPersonPosForm" class="request-data-form">
    <h3>Set position of person</h3>
    <form action="<?= BASEURL ?>api/person/setpos" method="post">
        <div class="std_margin">
            <label for="person_pos_id">Id</label>
            <input id="person_pos_id" class="stretch-input" name="id" type="text">
        </div>
        <div class="std_margin">
            <label for="person_pos_pos">Position</label>
            <input id="person_pos_pos" class="stretch-input" name="pos" type="text">
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>