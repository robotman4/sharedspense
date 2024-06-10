document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('linkLogout').addEventListener('click', function(event){
        event.preventDefault();
        logout();
    });

    document.getElementById('buttonAddExpense').addEventListener('click', function(event) {
        event.preventDefault();
        addExpense();
    });

    document.getElementById('buttonDeleteExpense').addEventListener('click', function(event) {
        event.preventDefault();
        const expenseId = this.dataset.expenseId;
        deleteExpense(expenseId);
    });
});

//TODO: run only for current view
fetchUnapprovedExpenses();

// TODO: make buttons highlighted dynamically based on selection