/**
 * Get current month.
 * @param {object} date - js Date object
 * @returns {number} month - current month 
 */
function getMonth(date) {
    var month = date.getMonth() + 1;
    return month;
}

/**
 * Get previous month.
 * @returns {number} month - current month 
 */
function getPrevMonth() {
    var prevMonthDate = new Date();
    prevMonthDate.setDate(0); // Sets date back 1 month
    var prevMonth = { 
        month: prevMonthDate.getMonth() + 1,
        year: prevMonthDate.getFullYear()
    }
    return prevMonth;
}

/**
 * Get current year.
 * @param {object} date - js Date object
 * @returns {number} year - current year 
 */
function getYear(date) {
    var year = date.getFullYear()
    return year;
}

/**
 * Detect currency ($, GBP, Yen, etc).
 * @returns {string}
 */
function detectCurrency() {
    return document.querySelector('.payment-history .tsla-expandable .total-data .section-title--dek' ).innerText.slice(0,1);
}

/**
 * Scrape the history page HTML and get charging history.
 * @returns {array}
 */
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

/**
 * Calculates total charges for a given month.
 * @param {array} charges - array of all supercharger visits.
 * @param {object} dateObject - object with 'month' and 'year' properties.
 * @param {number} year - year to search in.
 * @param {string} currencyType - currency symbol.
 * @returns {object}
 */
function calcTotalChargesByMonth(charges, dateObject, currencyType = '$') {
    var total = 0;
    var numCharges = 0;

    for (var i = 0; i < charges.length; i++) {
        if (
            charges[i].month === dateObject.month &&
            charges[i].year === dateObject.year ) {
                total = currency(total).add(charges[i].amount).value;
                numCharges++;
            }
    }

    return { 
        total: currency(total).format({ symbol: currencyType }),
        numCharges: numCharges 
    };
}

/**
 * Calculates total charges for a given year.
 * @param {array} charges - array of all supercharger visits.
 * @param {number} year - year to search in.
 * @param {string} currencyType - currency symbol.
 * @returns {object}
 */
function calcTotalChargesByYear(charges, year, currencyType = '$') {
    var total = 0;
    var numCharges = 0;

    for (var i = 0; i < charges.length; i++) {
        if (charges[i].year === year ) {
            total = currency(total).add(charges[i].amount).value;
            numCharges++;
        }
    }

    return { 
        total: currency(total).format({ symbol: currencyType }),
        numCharges: numCharges 
    };
}

/**
 * Calculates all time total charges.
 * @param {array} charges - array of supercharger visits.
 * @param {string} currencyType - currency symbol.
 * @returns {object}
 */
function calcTotalChargesAllTime(charges, currencyType = '$') {
    var total = 0;
    var numCharges = 0;

    for (var i = 0; i < charges.length; i++) {
        total = currency(total).add(charges[i].amount).value;
        numCharges++;
    }

    return { 
        total: currency(total).format({ symbol: currencyType }),
        numCharges: numCharges
    };
}

/**
 * Breaks down charges by month for use with the history chart.
 * @param {array} charges - array of supercharger visits.
 * @param {string} currencyType - currency symbol.
 * @returns {object}
 */
function getChartData(charges, currencyType = '$') {

    var currMonth, currYear, months = [], amounts = [];

    for (var i = 0; i < charges.length; i++) {

        if ( charges[i].month !== currMonth || charges[i].year !== currYear ) {
            currMonth = charges[i].month;
            currYear = charges[i].year;
            
            var formattedMonth = new Date(currYear, currMonth - 1);
            formattedMonth = formattedMonth.toLocaleString('default', { month: 'short'});
            months.push(`${formattedMonth} ${currYear}`);
            
            var amount = calcTotalChargesByMonth(charges, { month: currMonth, year: currYear }, currencyType );
            amounts.push(amount.total.substring(1));
        }
    }
   
    // Reverse results so months are displayed oldest to newest.
    return { 
        months: months.reverse(), 
        amounts: amounts.reverse() 
    };
}

function init() {

    var date = new Date(),
        charges = scrapeChargeHistory(),
        currencyType = detectCurrency(),
        currMonth = getMonth(date),
        prevMonth = getPrevMonth(),
        currYear = getYear(date);
    
    // Show this month's total.
    var totalChargesThisMonth = calcTotalChargesByMonth(charges, { month: currMonth, year: currYear }, currencyType);
    var totalChargesMonthEl = document.getElementById('total-charges-this-month');
    totalChargesMonthEl.querySelector('span').innerText = totalChargesThisMonth.total;
    totalChargesMonthEl.querySelector('small').innerText = totalChargesThisMonth.numCharges + ' charges';

    // Show last month's total.
    var totalChargesThisMonth = calcTotalChargesByMonth(charges, prevMonth, currencyType);
    var totalChargesMonthEl = document.getElementById('total-charges-last-month');
    totalChargesMonthEl.querySelector('span').innerText = totalChargesThisMonth.total;
    totalChargesMonthEl.querySelector('small').innerText = totalChargesThisMonth.numCharges + ' charges';

    // Show yearly total.
    var totalChargesThisYear = calcTotalChargesByYear(charges, currYear, currencyType);
    var totalChargesYearEl = document.getElementById('total-charges-this-year');
    totalChargesYearEl.querySelector('span').innerText = totalChargesThisYear.total;
    totalChargesYearEl.querySelector('small').innerText = totalChargesThisYear.numCharges + ' charges';
    
    // Show grand total.
    var totalCharges = calcTotalChargesAllTime(charges, currencyType);
    var totalChargesEl = document.getElementById('total-charges-all-time');
    totalChargesEl.querySelector('span').innerText = totalCharges.total;
    totalChargesEl.querySelector('small').innerText = totalCharges.numCharges + ' charges';

    // Create history chart.
    var chartEl = document.getElementById('chart');
    var chartData = getChartData(charges, currencyType);
    var chartOptions = {
        type: 'bar',
        label: '',
        data: {
            labels: chartData.months,
            datasets: [{
                label: '',
                data: chartData.amounts
            }]
        },
        options: {
            legend: {
                display: false
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
            },
            tooltips: {
                enabled: true,
                callbacks: {
                    label: function(tooltipItem) {
                        tooltipItem.yLabel = currency(tooltipItem.yLabel).format({ symbol: currencyType });
                        return tooltipItem.yLabel;
                    }
                }
            }
        }
    }
    var myChart = new Chart(chartEl, chartOptions);
}

// Get template file, insert into Tesla history page, init scraping functions.
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