let currencyType = detectCurrency();

fetch(chrome.extension.getURL('/template.html'))
    .then(response => response.text())
    .then(data => {
        // var content = document.getElementsByClassName('payment-content')[0].innerHTML;
        // document.getElementsByClassName('payment-content')[0].innerHTML = data + content;
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

    console.log(charges);
    
    return charges;
}

function calcTotalChargesThisMonth(charges, currentMonth, currentYear, currencyType = '$') {
    var total = 0;

    for (var i = 0; i < charges.length; i++) {
        if (
            charges[i].month === currentMonth &&
            charges[i].year === currentYear ) {
                total = currency(total).add(charges[i].amount).value;
            }
    }

    return currency(total).format({ symbol: currencyType });
}

function calcTotalChargesAllTime(charges, currencyType = '$') {

    var total = 0;

    for (var i = 0; i < charges.length; i++) {
        total = currency(total).add(charges[i].amount).value;
    }

    return currency(total).format({ symbol: currencyType });
}


function init() {

    var charges = scrapeChargeHistory();
    
    // Show monthly total.
    var totalChargesThisMonth = calcTotalChargesThisMonth(charges, getMonth(), getYear(), currencyType);
    var totalChargesMonthElem = document.getElementById('total-charges-this-month');
    totalChargesMonthElem.innerText = totalChargesThisMonth;
    
    // Show grand total.
    var totalCharges = calcTotalChargesAllTime(charges, currencyType);
    var totalChargesElem = document.getElementById('total-charges');
    totalChargesElem.innerText = totalCharges;
}