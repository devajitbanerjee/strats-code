const recordMetadata = {
    id: 'text',
    creditorName: 'text',
    firstName: 'text',
    lastName: 'text',
    minPaymentPercentage: 'number',
    balance: 'number'
};

export default function fetchDataHelper({ amountOfRecords }) {
    // tried using the Fetch API, github returns a good old 403 when unauthenticated. Thanks!!
    return fetch('https://raw.githubusercontent.com/StrategicFS/Recruitment/master/data.json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
            amountOfRecords,
            recordMetadata,
        }),
    }).then(response => response.json());
}
