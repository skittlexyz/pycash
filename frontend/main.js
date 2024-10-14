const apiUrl = "http://127.0.0.1:5000/"

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

let data = [];

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
                await fetchData();
            });
    } catch (e) {
        console.warn("Error connecting to the API!");
        errorModalLabel.text("API error");
        errorModalText.text(e);
        errorModal.modal('show');
    }
})();

function displayData() {
    $("tbody").html("");
    for (let i = 0; i < data.length; i++) {
        $(`#line-checkbox-${i}`).off();
        $("tbody").html(
            $("tbody").html() +
            tableLineModel
                .replace("<LINE-ID>", `line-${i}`)
                .replace("<LINE-CHECKBOX>", `line-checkbox-${i}`)
                .replace("<ID>", `${data[i].id}`)
                .replace("<VALUE-COLOR>", (data[i].value > 0 ? "#198754" : "#DC3545"))
                .replace("<VALUE>", (data[i].value > 0 ? `<i class="bi bi-arrow-down"></i>&nbsp;${BRL.format(data[i].value).replace("-", "")}` : `<i class="bi bi-arrow-up"></i>&nbsp;${BRL.format(data[i].value).replace("-", "")}`))
                .replace("<DATE>", `${data[i].date.replace("-", "/").replace("-", "/")}`)
                .replace("<DESCRIPTION>", `${data[i].description}`)
        );
    };
}

async function fetchData() {
    await fetch(apiUrl + "investments")
        .then(async (response) => {
            const responseBody = await response.json();
            // console.log(responseBody);
            data = responseBody;
        }).then(() => displayData()).then(() => main());
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
            for (let i = 0; i < data.length; i++) {
                $(`#line-${i} > *`).each(function () {
                    $(this).addClass("selected-line");
                });
                $(`#line-${i} > td >input`).prop("checked", true);
            }
        } else {
            for (let i = 0; i < data.length; i++) {
                $(`#line-${i} > *`).each(function () {
                    $(this).removeClass("selected-line");
                });
                $(`#line-${i} > td > input`).prop("checked", false);
            }
        }
    });

    for (let i = 0; i < data.length; i++) {
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
        data = data.reverse();
        displayData();
    });
}
