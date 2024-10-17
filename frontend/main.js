const apiPort = 7777;
const apiUrl = `http://127.0.0.1:${apiPort}/`;

const cdi = 0.1065;

let BRL = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

const refreshButton = $("#refresh-button");
const configureButton = $("#configure-button");

const startDate = $("#start-date");
const endDate = $("#end-date");

const dateOrderButton = $("#date-order-button");

const addButton = $("#add-button");
const deleteButton = $("#delete-button");
const editButton = $("#edit-button");

const collapseExpandButton = $("#collapse-expand-button");
const summaryDateRange = $("#summary-date-range");

const investedSpan = $("#invested-span");
const spentSpan = $("#spent-span");
const profitSpan = $("#profit-span");
const savingsSpan = $("#savings-span");

const allLinesCheckbox = $("#all-lines-checkbox");

const errorModal = $("#error-modal");
const errorModalLabel = $("#error-modal-label");
const errorModalText = $("#error-modal-text");

const summary = $("#summary");

let investments = [];
let results = 0;

const tableLineModel = "" +
    "<tr id='<LINE-ID>'>" +
    "<td>" +
    "<input id='<LINE-CHECKBOX>' class='form-check-input' type='checkbox'>" +
    "</td>" +
    "<th scope='row' class='tw-text-center'><ID></th>" +
    "<td style='color:<VALUE-COLOR>;' class='tw-font-bold'><VALUE></td>" +
    "<td class=''><DATE></td>" +
    "<td class=''><DESCRIPTION></td>" +
    "</tr>";

(async () => {
    try {
        await fetch(apiUrl + "ping")
            .then(async (response) => {
                const responseBody = await response.json();
                console.log("Connected successfully to the API:", responseBody["message"]);
                await fetchInvestments();
                await fetchResults();
                main();
            });
    } catch (e) {
        console.warn("Error connecting to the API!");
        errorModalLabel.text("API error");
        errorModalText.text(e);
        errorModal.modal('show');
    }
})();

function displayResults() {
    let invested = 0.0;
    let spent = 0.0;
    let profit = 0.0;
    let savings = 0.0;

    for (let i = 0; i < investments.length; i++) {
        if (Math.sign(investments[i].value) == 1) invested += investments[i].value
        if (Math.sign(investments[i].value) == -1) spent += investments[i].value
    }
    savings = results;
    profit = invested - (spent * -1);

    investedSpan.text(String(invested.toFixed(2)).replace(".",",").replace("-",""));
    spentSpan.text(String(spent.toFixed(2)).replace(".",",").replace("-",""));
    profitSpan.text(String(profit.toFixed(2)).replace(".",",").replace("-",""));
    savingsSpan.text(String(savings.toFixed(2)).replace(".",",").replace("-",""));
}

function displayInvestments() {
    $("tbody").html("");
    for (let i = 0; i < investments.length; i++) {
        $(`#line-checkbox-${i}`).off();
        $("tbody").html(
            $("tbody").html() +
            tableLineModel
                .replace("<LINE-ID>", `line-${i}`)
                .replace("<LINE-CHECKBOX>", `line-checkbox-${i}`)
                .replace("<ID>", `${investments[i].id}`)
                .replace("<VALUE-COLOR>", (investments[i].value > 0 ? "#198754" : "#DC3545"))
                .replace("<VALUE>", (investments[i].value > 0 ? `<i class="bi bi-arrow-down"></i>&nbsp;${BRL.format(investments[i].value).replace("-", "")}` : `<i class="bi bi-arrow-up"></i>&nbsp;${BRL.format(investments[i].value).replace("-", "")}`))
                .replace("<DATE>", `${investments[i].date.replace("-", "/").replace("-", "/")}`)
                .replace("<DESCRIPTION>", `${investments[i].description}`)
        );
    };
}

async function fetchResults() {
    await fetch(apiUrl + "calculate-return",
        {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                "cdi_rate": cdi,
                "start_date": investments[0].date,
                "end_date": ""
            })
        }
    )
        .then(async (response) => {
            const responseBody = await response.json();
            results = responseBody.total_return;
        }).then(() => displayResults());
}

async function fetchInvestments() {
    await fetch(apiUrl + "investments")
        .then(async (response) => {
            const responseBody = await response.json();
            // console.log(responseBody);
            investments = responseBody;
        }).then(() => displayInvestments());
}

function main() {
    refreshButton.on("click", () => location.reload() );
    collapseExpandButton.on("click", () => {
        $("#collapse-expand-button").toggleClass("tw-rotate-180")
        $("body > main > section > hr").toggle(250);
        summary.toggle(250);
    })
    allLinesCheckbox.on("click", function () {
        if ($(this).is(':checked')) {
            for (let i = 0; i < investments.length; i++) {
                $(`#line-${i} > *`).each(function () {
                    $(this).addClass("selected-line");
                });
                $(`#line-${i} > td >input`).prop("checked", true);
            }
        } else {
            for (let i = 0; i < investments.length; i++) {
                $(`#line-${i} > *`).each(function () {
                    $(this).removeClass("selected-line");
                });
                $(`#line-${i} > td > input`).prop("checked", false);
            }
        }
    });

    for (let i = 0; i < investments.length; i++) {
        $(`#line-checkbox-${i}`).on("click", function () {
            if ($(this).is(':checked')) {
                console.log(1)
                $(`#line-${i} > *`).each(function () {
                    $(this).addClass("selected-line");
                });
            } else {
                console.log(2)
                $(`#line-${i} > *`).each(function () {
                    $(this).removeClass("selected-line");
                });
            }
        });
    };
    dateOrderButton.on("click", function () {
        $(this).toggleClass("bi-arrow-down");
        $(this).toggleClass("bi-arrow-up");
        if (allLinesCheckbox.is(':checked')) {
            allLinesCheckbox.prop("checked", false);
        };
        investments = investments.reverse();
        displayInvestments();
    });
}
