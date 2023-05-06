<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\App\Model\ImportTemplateModel;

/**
 * Import templates API controller
 */
class ImportTemplate extends ApiListController
{
    protected $requiredFields = [
        "name",
        "type_id",
        "account_id",
        "first_row",
        "date_col",
        "comment_col",
        "trans_curr_col",
        "trans_amount_col",
        "account_curr_col",
        "account_amount_col",
        "date_locale",
    ];
    protected $defaultValues = [
        "type_id" => 0,
        "account_id" => 0,
    ];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = ImportTemplateModel::getInstance();
        $this->createErrorMsg = __("ERR_IMPTPL_CREATE");
        $this->updateErrorMsg = __("ERR_IMPTPL_UPDATE");
        $this->deleteErrorMsg = __("ERR_IMPTPL_DELETE");
    }

    /**
     * Returns list request prepared for controller-specific model
     *
     * @param array $request
     *
     * @return array
     */
    protected function prepareListRequest(array $request)
    {
        return [];
    }
}
