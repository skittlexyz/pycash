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

const tableLineModel = `
<tr id='<LINE-ID>'>
    <td>
        <input id='<LINE-CHECKBOX>' class='form-check-input' type='checkbox'>
    </td>
    <th scope='row' class='tw-text-center'><ID></th>
    <td style='color:<VALUE-COLOR>;' class='tw-font-bold'><VALUE></td>
    <td class=''><DATE></td>
    <td class=''><DESCRIPTION></td>
</tr>`;

(async () => {
    try {
        const response = await fetch(apiUrl + "ping");
        const responseBody = await response.json();
        console.log("Connected successfully to the API:", responseBody.message);
        await fetchInvestments(false);
        await fetchResults();
        main();
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

    investments.forEach(investment => {
        if (investment.value > 0) invested += investment.value;
        if (investment.value < 0) spent += investment.value;
    });

    savings = results;
    profit = invested - (spent * -1);

    investedSpan.text(invested.toFixed(2).replace(".", ",").replace("-", ""));
    spentSpan.text(spent.toFixed(2).replace(".", ",").replace("-", ""));
    profitSpan.text(profit.toFixed(2).replace(".", ",").replace("-", ""));
    savingsSpan.text(savings.toFixed(2).replace(".", ",").replace("-", ""));
}

function displayInvestments() {
    $("tbody").html("");  // Clear existing rows
    investments.forEach((investment, i) => {
        const valueColor = investment.value > 0 ? "#198754" : "#DC3545";
        const valueText = investment.value > 0
            ? `<i class="bi bi-arrow-down"></i>&nbsp;${BRL.format(investment.value).replace("-", "")}`
            : `<i class="bi bi-arrow-up"></i>&nbsp;${BRL.format(investment.value).replace("-", "")}`;

        const dateFormatted = investment.date.replace(/-/g, "/");

        $("tbody").append(
            tableLineModel
                .replace("<LINE-ID>", `line-${i}`)
                .replace("<LINE-CHECKBOX>", `line-checkbox-${i}`)
                .replace("<ID>", `${investment.id}`)
                .replace("<VALUE-COLOR>", valueColor)
                .replace("<VALUE>", valueText)
                .replace("<DATE>", dateFormatted)
                .replace("<DESCRIPTION>", investment.description)
        );
    });
}

async function fetchResults() {
    const response = await fetch(apiUrl + "calculate-return", {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
            "cdi_rate": cdi,
            "start_date": investments[0]?.date || "",
            "end_date": ""
        })
    });
    const responseBody = await response.json();
    results = responseBody.total_return;
    displayResults();
}

async function fetchInvestments(returnResult) {
    const response = await fetch(apiUrl + "investments");
    const responseBody = await response.json();
    if (returnResult) return responseBody;
    investments = responseBody;
    displayInvestments();
}

function main() {
    refreshButton.on("click", () => location.reload());
    collapseExpandButton.on("click", () => {
        $("#collapse-expand-button").toggleClass("tw-rotate-180");
        $("body > main > section > hr").toggle(250);
        summary.toggle(250);
    });

    allLinesCheckbox.on("click", function () {
        $("tbody input[type='checkbox']").prop('checked', this.checked);
        $("tbody tr").toggleClass("selected-line", this.checked);
    });

    dateOrderButton.on("click", () => {
        dateOrderButton.toggleClass("bi-arrow-down bi-arrow-up");
        if (allLinesCheckbox.is(':checked')) {
            allLinesCheckbox.prop("checked", false);
        }
        investments.reverse();
        displayInvestments();
    });
}

async function filterByDate() {
    const startDateValue = startDate.val() ? new Date(startDate.val()) : new Date("1900-01-01");
    const endDateValue = endDate.val() ? new Date(endDate.val()) : new Date("2100-12-31");
    
    investments = await fetchInvestments(true);
    investments = investments.filter((investment) => {
        const investmentDate = new Date(investment.date);
        return investmentDate >= startDateValue && investmentDate <= endDateValue;
    });

    displayInvestments();
}

startDate.on("change", filterByDate);
endDate.on("change", filterByDate);
