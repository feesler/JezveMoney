export const getListRequest = () => ({});

export const prepareRequest = (data) => ({
    ...data,
    returnState: {
        schedule: getListRequest(),
        profile: {},
    },
});

export const getListDataFromResponse = (response) => (
    response?.data?.state?.schedule?.data
);
