async function fetchUnapprovedExpenses() {
    const url = '/api/v1/expense/unapproved';
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            showErrorDialog('Failed to get a valid response from backend.');
            return null;
        }
        const data = await response.json();
        if (data && data.success) {
            var expenseList = document.getElementById('list');
            expenseList.innerHTML = '';
            if (Array.isArray(data.expenses)) {
                data.expenses.forEach(expense => {
                    drawExpenseItem(expense.id, expense.name, expense.cost);
                });
                document.querySelectorAll('.editbutton').forEach(button => {
                    button.addEventListener('click', function() {
                        const expenseId = this.dataset.expenseId;
                        populateEditDialog(expenseId);
                    });
                });
            } else {
                showErrorDialog('Unexpected response format: expenses array is missing.');
                return null;
            }
            updateTotalCost();
        } else {
            showErrorDialog('Failed to fetch unapproved expenses: ' + (data.message || 'Unknown error.'));
            return null;
        }
    } catch (error) {
        console.error('Error fetching unapproved expenses:', error);
        showErrorDialog('Failed to fetch unapproved expenses. Please try again later.');
        return null;
    }
}

async function fetchApprovedExpenses() {
    const url = '/api/v1/expense/approved';
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const groupedData = {};

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            showErrorDialog('Failed to get a valid response from backend.');
            return null;
        }
        const data = await response.json();
        if (data && data.success) {
            var archiveList = document.getElementById('archiveList');
            archiveList.innerHTML = '';
            if (Array.isArray(data.expenses)) {
                data.expenses.reverse().forEach(expense => {
                    const { year, month, cost, paid } = expense;

                    if (!groupedData[year]) {
                        groupedData[year] = {};
                    }

                    if (!groupedData[year][month]) {
                        groupedData[year][month] = {
                            totalCost: 0,
                            allPaid: true
                        };
                    }

                    groupedData[year][month].totalCost += cost;
                    if (!paid) {
                        groupedData[year][month].allPaid = false;
                    }
                });

                for (const year in groupedData) {
                    for (const month in groupedData[year]) {
                        const { totalCost, allPaid } = groupedData[year][month];
                        drawArchiveItem(year, month, totalCost, allPaid);
                    }
                }

                document.querySelectorAll('.editbutton').forEach(button => {
                    button.addEventListener('click', function() {
                        const archiveId = this.dataset.archiveId;
                        populateListArchiveDialog(archiveId, data);
                    });
                });

            } else {
                showErrorDialog('Unexpected response format: expenses array is missing.');
                return null;
            }
        } else {
            showErrorDialog('Failed to fetch approved expenses: ' + (data.message || 'Unknown error.'));
            return null;
        }
    } catch (error) {
        console.error('Error fetching approved expenses:', error);
        showErrorDialog('Failed to fetch approved expenses. Please try again later.');
        return null;
    }
}

function updateTotalCost() {
    // Get the total cost element
    const totalElement = document.getElementById('headerTotalCost');

    // Reset the initial cost which should be 0
    var totalCost = 0;

    // Find all cost buttons
    const costButtons = document.querySelectorAll('.costButton');
    if (costButtons.length == 0) {
        totalElement.innerText = 0;
    }
    costButtons.forEach(button => {
        // Get the button cost
        const costValue = parseInt(button.innerText, 10);
        if (!isNaN(costValue)) {
            totalCost += costValue;
        }
        totalElement.innerText = totalCost;
    });

    const numberOfExpensesElement = document.getElementById('spanNumberOfExpenses');
    numberOfExpensesElement.innerText = costButtons.length
}

function addExpense() {
    const progress = document.getElementById('dialogProgress');
    progress.showModal();

    const nameInput = document.getElementById('addName');
    const costInput = document.getElementById('addCost');

    const name = nameInput.value;
    const cost = costInput.value;

    fetch('/api/v1/expense/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, cost})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            nameInput.value = '';
            costInput.value = '';
            progress.close();
            fetchUnapprovedExpenses();
        } else {
            progress.close();
            showErrorDialog(`Error creating expense:' ${data.message}`);
        }
    })
    .catch(error => {
        console.error('An error occurred during expense creation:', error);
        progress.close();
        showErrorDialog('An error occurred during expense creation.');
    });
}

function deleteExpense(expenseId) {
    const progress = document.getElementById('dialogProgress');
    progress.showModal();

    fetch(`/api/v1/expense/delete`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: expenseId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            progress.close();
            fetchUnapprovedExpenses();
        } else {
            console.error('Error deleting expense:', data.message);
            progress.close();
            showErrorDialog(`Error deleting expense: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('An error occurred during expense deletion:', error);
        progress.close();
        showErrorDialog('An error occurred during expense deletion.');
    });
}

function updateExpense(expenseId) {
    const progress = document.getElementById('dialogProgress');
    progress.showModal();

    const name = document.getElementById('editName').value;
    const cost = document.getElementById('editCost').value;

    fetch('/api/v1/expense/update', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: expenseId, name, cost })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            progress.close();
            fetchUnapprovedExpenses();
        } else {
            console.error('Error updating expense:', data.message);
            progress.close();
            showErrorDialog(`Error updating expense: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('An error occurred during expense update:', error);
        progress.close();
        showErrorDialog('An error occurred during expense update.');
    });
}

function approveExpenses(month, year) {
    const progress = document.getElementById('dialogProgress');
    progress.showModal();

    fetch('/api/v1/expense/approve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month: month, year: year})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            progress.close();
            fetchUnapprovedExpenses();
        } else {
            console.error('Error approving expenses:', data.message);
            progress.close();
            showErrorDialog(`Error approving expense: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('An error occurred during expense update:', error);
        progress.close();
        showErrorDialog('An error occurred during expense update.');
    });
}

function revertArchive(archiveId) {
    const progress = document.getElementById('dialogProgress');
    progress.showModal();

    const [year, month] = archiveId.split('-');

    fetch(`/api/v1/expense/unapprove`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month: month, year: year })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            progress.close();
            fetchApprovedExpenses();
        } else {
            console.error('Error reverting archive status:', data.message);
            progress.close();
            showErrorDialog(`Error reverting archive: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('An error occurred during expense deletion:', error);
        progress.close();
        showErrorDialog('An error occurred during expense deletion.');
    });
}

function setArchiveAsPaid(archiveId) {
    const progress = document.getElementById('dialogProgress');
    progress.showModal();

    const [year, month] = archiveId.split('-');

    fetch(`/api/v1/expense/paid`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month: month, year: year })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            progress.close();
            fetchApprovedExpenses();
        } else {
            console.error('Error setting paid status:', data.message);
            progress.close();
            showErrorDialog(`Error setting paid status: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('An error occurred during setting paid:', error);
        progress.close();
        showErrorDialog('An error occurred during setting paid.');
    });
}

function drawExpenseItem(id, name, cost) {
    // Create the main div with class 's12'
    var div = document.createElement('div');
    div.className = 's12';

    // Create the nav element with class 'no-space'
    var nav = document.createElement('nav');
    nav.className = 'no-space';

    // Create the first button element
    var nameButton = document.createElement('button');
    nameButton.setAttribute('data-expense-id', id);
    nameButton.className = 'border left-round max extra namebutton';
    var nameText = document.createElement('span');
    nameText.textContent = name;
    nameButton.appendChild(nameText);

    // Create the second button element
    var costButton = document.createElement('button');
    costButton.setAttribute('data-expense-id', id);
    costButton.className = 'border no-round extra costbutton';
    var costAmount = document.createElement('span');
    costAmount.textContent = cost;
    costButton.appendChild(costAmount);

    // Create the third button element
    var editButton = document.createElement('button');
    editButton.setAttribute('data-expense-id', id);
    editButton.className = 'border right-round extra editbutton';
    editButton.setAttribute('data-ui', '#dialogEditExpense');
    var icon = document.createElement('i');
    icon.className = 'small';
    icon.textContent = 'Edit';
    editButton.appendChild(icon);

    // Append buttons to the nav element
    nav.appendChild(nameButton);
    nav.appendChild(costButton);
    nav.appendChild(editButton);

    // Append nav to the main div
    div.appendChild(nav);

    // Append the main div to the div with ID 'list'
    document.getElementById('list').appendChild(div);
}

function drawArchiveItem(year, month, cost, paid) {
    const id = `${year}-${month}`;

    // Create the main div with class 's12'
    var div = document.createElement('div');
    div.className = 's12';

    // Create the nav element with class 'no-space'
    var nav = document.createElement('nav');
    nav.className = 'no-space';

    // Create the first button element
    var nameButton = document.createElement('button');
    nameButton.className = 'border left-round max extra namebutton';
    var nameText = document.createElement('span');
    nameText.textContent = id;
    nameButton.appendChild(nameText);

    // Create the second button element
    var costButton = document.createElement('button');
    costButton.className = 'border no-round extra costbutton';
    var costAmount = document.createElement('span');
    costAmount.textContent = cost;
    costButton.appendChild(costAmount);

    // Create the third button element
    var editButton = document.createElement('button');
    editButton.setAttribute('data-archive-id', id);
    editButton.className = 'border right-round extra editbutton';
    editButton.setAttribute('data-ui', '#dialogListArchive');
    var icon = document.createElement('i');
    icon.className = 'small';

    let iconSymbol;
    if (paid) {
      iconSymbol = 'done_all';
    } else {
      iconSymbol = 'hourglass_top';
    }

    icon.textContent = iconSymbol;
    editButton.appendChild(icon);

    // Append buttons to the nav element
    nav.appendChild(nameButton);
    nav.appendChild(costButton);
    nav.appendChild(editButton);

    // Append nav to the main div
    div.appendChild(nav);

    // Append the main div to the div with ID 'list'
    document.getElementById('archiveList').appendChild(div);
}

function populateEditDialog(expenseId) {
    // Get values
    const nameInput = document.getElementById('editName');
    const costInput = document.getElementById('editCost');
    const deleteButton = document.getElementById('buttonDeleteExpense');
    const saveButton = document.getElementById('buttonSaveEdit');

    // Set values
    nameInput.value = document.querySelector(`.nameButton[data-expense-id="${expenseId}"]`).textContent;
    costInput.value = document.querySelector(`.costButton[data-expense-id="${expenseId}"]`).textContent;
    deleteButton.setAttribute('data-expense-id', expenseId);
    saveButton.setAttribute('data-expense-id', expenseId);
}

function populateListArchiveDialog(archiveId, data) {
    // Get values
    const [year, month] = archiveId.split('-').map(Number);
    const nameInput = document.getElementById('editName');
    const costInput = document.getElementById('editCost');
    const unapproveButton = document.getElementById('buttonRevertArchive');
    const paidButton = document.getElementById('buttonMarkAsPaid');

    // Set values
    unapproveButton.setAttribute('data-archive-id', archiveId);
    paidButton.setAttribute('data-archive-id', archiveId);

    // Filter the expenses array according to archiveId
    const filteredExpenses = data.expenses.filter(
        expense => expense.year === year && expense.month === month
    );

    if (Array.isArray(filteredExpenses)) {
        var expenseList = document.getElementById('list');
        expenseList.innerHTML = '';
        filteredExpenses.forEach(expense => {
            drawExpenseItem(expense.id, expense.name, expense.cost);
        });
    } else {
        showErrorDialog('Unexpected response format: expenses array is missing.');
        return null;
    }
}

function showErrorDialog(message) {
    // Set the error message in the div with id 'divErrorMessage'
    document.getElementById('divErrorMessage').textContent = message;

    // Find the element that uses the data-ui attribute to show the dialog
    const triggerElement = document.querySelector('[data-ui="#dialogError"]');
    if (triggerElement) {
        triggerElement.click();
    }
}

async function login() {
    const progress = document.getElementById('dialogProgress');
    progress.showModal();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/v1/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        progress.close();

        if (response.ok) {
            window.location.href = '/client';
        } else {
            showErrorDialog(result.message || 'Unknown error');
        }
    } catch (error) {
        progress.close();
        showErrorDialog('Failed to login due to network error');
    }
}

async function logout() {
    try {
        const response = await fetch('/api/v1/logout', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            window.location.href = '/client/login';
        } else {
            showErrorDialog(result.message || 'Unknown error');
        }
    } catch (error) {
        showErrorDialog('Failed to logout due to network error');
    }
}
