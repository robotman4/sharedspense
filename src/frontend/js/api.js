async function fetchUnapprovedExpenses(bearerToken) {
    const url = '/api/v1/expenses/unapproved';
    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            showErrorDialog('Failed to get a valid response from backend.');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching unapproved expenses:', error);
        showErrorDialog(`Failed to fetch unapproved expenses. Please try again later.`);
        return null;
    }
}

function createExpenseItem(id, name, cost) {
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
    editButton.className = 'border right-round extra';
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

function showErrorDialog(message) {
    // Set the error message in the div with id 'divErrorMessage'
    document.getElementById('divErrorMessage').textContent = message;

    // Find the element that uses the data-ui attribute to show the dialog
    const triggerElement = document.querySelector('[data-ui="#dialogError"]');
    if (triggerElement) {
        triggerElement.click();
    }
}

async function login(username, password) {
    const progress = document.getElementById('dialogProgress');
    progress.showModal();

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

function main() {
    const token = 'your-bearer-token-here';

    fetchUnapprovedExpenses(token)
    .then(data => {
        if (data && data.success) {
            data.forEach(expense => {
                createExpenseItem(expense.id, expense.name, expense.cost);
            });
        } else {
            showErrorDialog('Failed to fetch unapproved expenses: ' + data.message);
        }
    });
}