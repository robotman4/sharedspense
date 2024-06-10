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
                        popuplateEditDialog(expenseId);
                    });
                });
            } else {
                showErrorDialog('Unexpected response format: expenses array is missing.');
                return null;
            }
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
            console.log('Expense created successfully:', data.message);
            progress.close();
            fetchUnapprovedExpenses();
        } else {
            console.error('Error creating expense:', data.message);
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
            console.log('Expense deleted successfully:', data.message);
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

function drawExpenseItem(id, name, cost) {
    // Create the main div with class 's12'
    var div = document.createElement('div');
    div.className = 's12';

    // Create the nav element with class 'no-space'
    var nav = document.createElement('nav');
    nav.className = 'no-space';

    // Create the first button element
    var nameButton = document.createElement('button');
    nameButton.className = 'border left-round max extra';
    var nameText = document.createElement('span');
    nameText.textContent = name;
    nameButton.appendChild(nameText);

    // Create the second button element
    var costButton = document.createElement('button');
    costButton.className = 'border no-round extra';
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

function popuplateEditDialog(expenseId) {
    const nameInput = document.getElementById("editName");
    const costInput = document.getElementById("editCost");
    const deleteButton = document.getElementById("buttonDeleteExpense");

    nameInput.value = 'AAA';
    costInput.value = '300';
    deleteButton.setAttribute('data-expense-id', expenseId);
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