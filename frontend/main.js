const apiUrl = "http://127.0.0.1:5000/"

let BRL = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

const refreshButton = $("#refresh-button");
const configureButton = $("#configure-button");

const startDate = $("#start-date");
const endDate = $("#end-date");

const addButton = $("#add-button");
const deleteButton = $("#delete-button");
const editButton = $("#edit-button");

const collapseExpandButton = $("#collapse-expand-button");
const summaryDateRange = $("#summary-date-range");

const investedSpan = $("#invested-span");
const spentSpan = $("#spent-span");
const profitSpan = $("#profit-span");
const savingsSpan = $("#savings-span");

const errorModal = $("#error-modal");
const errorModalLabel = $("#error-modal-label");
const errorModalText = $("#error-modal-text");

let data;

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

async function fetchData() {
    await fetch(apiUrl + "investments")
        .then(async (response) => {
            const responseBody = await response.json();
            // console.log(responseBody);
            data = responseBody;
        }).then(() => {
            $("tbody").html("");
            for (let i = 0; i < data.length; i++) {
                $(`#line-${i}`).off();
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
                )
                $(`#line-checkbox-${i}`).on("click", () => {
                    console.log(1);
                    $(`#line-${i} > *`).each(() => {
                        $(this).toggleClass("selected-line");
                    });
                })
            }
        });
}

refreshButton.on("click", fetchData);