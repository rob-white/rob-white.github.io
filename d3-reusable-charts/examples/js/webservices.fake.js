$.ajax.fake.registerWebservice('http://example.url.com/example1.json', function(data) {
    var someDates = ["01/01/2015", "01/02/2015", "01/03/2015", "01/04/2015", "01/05/2015", "01/06/2015"];
    var mockData = [];
    for(var i = 0; i < 500; i++) {
        mockData.push({
            id: i,
            player: 'Player ' + i,
            gender: i % 3 == 0 ? 'Male' : 'Female',
            score: Math.round(Math.random() * (1 - 99) + 99),
            date: someDates[Math.floor((Math.random() * 5))] + ' ' + Math.floor((Math.random() * 24)) +':' + Math.floor((Math.random() * 59)) + ':' + Math.floor((Math.random() * 59))
        });
    }

    return mockData;
});

$.ajax.fake.registerWebservice('http://example.url.com/example2.json', function(data) {
    var someDates = ["01/01/2015", "01/02/2015", "01/03/2015", "01/04/2015", "01/05/2015", "01/06/2015"];
    var mockData = [];
    for(var i = 0; i < 500; i++) {
        mockData.push({
            id: i,
            player: 'Player ' + i,
            gender: i % 3 == 0 ? 'Male' : 'Female',
            score: Math.round(Math.random() * (1 - 99) + 99),
            date: someDates[Math.floor((Math.random() * 5))]
        });
    }

    return mockData;
});