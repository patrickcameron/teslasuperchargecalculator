// document.getElementsByClassName('section-title')[0].style.display = 'none !important';
// document.body.style.display = 'none';
// document.addEventListener('DOMContentLoaded', function() {
//     console.log('>>>');
//     jQuery.get(chrome.runtime.getURL('/template.html'), function(data) {
//         console.log('>>>');
//         console.log(data);
//     });
// }, false);

fetch(chrome.extension.getURL('/template.html'))
    .then(response => response.text())
    .then(data => {
        var content = document.getElementsByClassName('payment-history')[0].innerHTML;
        document.getElementsByClassName('payment-history')[0].innerHTML = data + content;
    })
    .catch(err => {
        console.error(err);
    })


var charges = [];

function calculateTotalCharges() {
    
    var chargeHistory = document.querySelectorAll('.payment-history .tsla-expandable');
    
    for (var i = 0; i < chargeHistory.length; i++) {
        console.log(chargeHistory[i]);

        if ( undefined !== chargeHistory[i] ) {
            var charge = chargeHistory[i].querySelector('.total-data .section-title--dek').innerText;
            charges.push(charge);
        }
    }
    console.log(charges);
}

calculateTotalCharges();

// console.log(document.querySelectorAll('.payment-history .tsla-expandable'));