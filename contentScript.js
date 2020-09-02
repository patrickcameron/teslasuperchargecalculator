fetch(chrome.extension.getURL('/template.html'))
    .then(response => response.text())
    .then(data => {
        var appDiv = document.createElement('div');
        appDiv.classList.add('supercharger-totals');
        appDiv.innerHTML = data;
        document.getElementsByClassName('payment-history-wrapper')[0].prepend(appDiv);
        init();
    })
    .catch(err => {
        console.error(err);
    })

function getMonth() {
    var dt = new Date();
    var month = dt.getMonth() + 1;
    return month;
}

function getYear() {
    var dt = new Date();
    return dt.getFullYear();
}

function detectCurrency() {
    return document.querySelector('.payment-history .tsla-expandable .total-data .section-title--dek' ).innerText.slice(0,1);
}

function scrapeChargeHistory() {
    var charges = [];
    
    var chargeHistory = document.querySelectorAll('.payment-history .tsla-expandable');
    
    for (var i = 0; i < chargeHistory.length; i++) {

        var data = {};

        // Transaction ID
        var transactionLinkElem = chargeHistory[i].querySelector('.invoice-links');
        
        if ( transactionLinkElem ) {
            var transactionID = transactionLinkElem.getAttribute('href');
            data.id = parseInt(transactionID);
        } else {
            data.id = null;
        }

        // Location
        var location = chargeHistory[i].querySelector('.location-data > h3').innerText;
        data.location = location;

        // Date
        var date = chargeHistory[i].querySelector('.date-data > .section-title--dek > span');
        data.month = parseInt(date.innerText.substr(0,2));
        data.day = parseInt(date.innerText.substr(3,2));
        data.year = parseInt(date.innerText.substr(6,4));

        // Amount
        var amount = chargeHistory[i].querySelector('.total-data .section-title--dek').innerText;
        data.amount = currency(amount).value;

        charges.push(data);
    }

    return charges;
}

function calcTotalChargesThisMonth(charges, currentMonth, currentYear, currencyType = '$') {
    var total = 0;
    var numCharges = 0;

    for (var i = 0; i < charges.length; i++) {
        if (
            charges[i].month === currentMonth &&
            charges[i].year === currentYear ) {
                total = currency(total).add(charges[i].amount).value;
                numCharges++;
            }
    }

    return { total: currency(total).format({ symbol: currencyType }), numCharges: numCharges };
}

function calcTotalChargesThisYear(charges, currentYear, currencyType = '$') {
    var total = 0;
    var numCharges = 0;

    for (var i = 0; i < charges.length; i++) {
        if (charges[i].year === currentYear ) {
            total = currency(total).add(charges[i].amount).value;
            numCharges++;
        }
    }

    return { total: currency(total).format({ symbol: currencyType }), numCharges: numCharges };
}

function calcTotalChargesAllTime(charges, currencyType = '$') {
    var total = 0;
    var numCharges = 0;

    for (var i = 0; i < charges.length; i++) {
        total = currency(total).add(charges[i].amount).value;
        numCharges++;
    }

    return { total: currency(total).format({ symbol: currencyType }), numCharges: numCharges };
}

function getChartData(charges, currencyType = '$') {
    var currMonth, currYear;
    var months = [];
    var amounts = [];

    console.log(charges);

    for (var i = 0; i < charges.length; i++) {
        if ( charges[i].month !== currMonth || charges[i].year !== currYear ) {
            currMonth = charges[i].month;
            currYear = charges[i].year;

            // console.log(currMonth);
            // console.log(currYear );
            
            var formattedMonth = new Date(currYear, currMonth);
            formattedMonth = formattedMonth.toLocaleString('default', { month: 'short'});
            console.log(`${formattedMonth} ${currYear} ${charges[i].year}`);
            months.push(`${formattedMonth} ${currYear}`);
            
            var amount = calcTotalChargesThisMonth(charges, currMonth, currYear, currencyType );
            amounts.push(amount.total.substring(1));
        }
    }
   
    return { months: months.reverse(), amounts: amounts.reverse() };
}


function init() {

    var currencyType = detectCurrency();
    var charges = scrapeChargeHistory();
    
    // Show monthly total.
    var totalChargesThisMonth = calcTotalChargesThisMonth(charges, getMonth(), getYear(), currencyType);
    var totalChargesMonthElem = document.getElementById('total-charges-this-month');
    totalChargesMonthElem.innerText = totalChargesThisMonth.total;
    var totalChargesMonthElemVisits = document.getElementById('total-charges-this-month--visits');
    totalChargesMonthElemVisits.innerText = totalChargesThisMonth.numCharges + ' charges';

    // Show yearly total.
    var totalChargesThisYear = calcTotalChargesThisYear(charges, getYear(), currencyType);
    var totalChargesYearElem = document.getElementById('total-charges-this-year');
    totalChargesYearElem.innerText = totalChargesThisYear.total;
    var totalChargesYearElemVisits = document.getElementById('total-charges-this-year--visits');
    totalChargesYearElemVisits.innerText = totalChargesThisYear.numCharges + ' charges';
    
    // Show grand total.
    var totalCharges = calcTotalChargesAllTime(charges, currencyType);
    var totalChargesElem = document.getElementById('total-charges');
    totalChargesElem.innerText = totalCharges.total;
    var totalChargesElemVisits = document.getElementById('total-charges--visits');
    totalChargesElemVisits.innerText = totalCharges.numCharges + ' charges';

    // Create history chart.
    var chart = document.getElementById('chart');
    var chartData = getChartData(charges, currencyType);
    var myChart = new Chart(chart, {
        type: 'bar',
        data: {
            labels: chartData.months,
            datasets: [{
                data: chartData.amounts
            }]
        },
        options: {
            tooltips: {
                enabled: true,
                callbacks: {
                    label: function(tooltipItem) {
                        tooltipItem.yLabel = currency(tooltipItem.yLabel).format({ symbol: currencyType });
                        return tooltipItem.yLabel;
                    }
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        // Add currency symbol to numbers on y axis.
                        callback: function(value) {
                            return currencyType + value;
                        }
                    }
                }]
            }
        }
    })
}