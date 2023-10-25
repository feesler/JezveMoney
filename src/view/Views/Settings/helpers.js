export const getListRequest = () => ({});

export const prepareRequest = (data) => ({
    ...data,
    returnState: {
        userCurrencies: getListRequest(),
    },
});

export const getListDataFromResponse = (response) => (
    response?.data?.state?.userCurrencies?.data
);
