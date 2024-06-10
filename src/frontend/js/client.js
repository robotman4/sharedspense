document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('linkLogout').addEventListener('click', function(event){
        event.preventDefault();
        logout();
    });

    document.getElementById('buttonAddExpense').addEventListener('click', function(event) {
        event.preventDefault();
        postAddExpense();
    });
});

fetchUnapprovedExpenses();

// TODO: make buttons highlighted dynamically based on selection