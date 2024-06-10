document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;

    document.getElementById('linkMenuLogout').addEventListener('click', function(event){
        event.preventDefault();
        logout();
    });

    // Check if the current URL matches '/client/current'
    if (currentPath === '/client/current') {
        // Call your function
        fetchUnapprovedExpenses();

        document.getElementById('buttonAddExpense').addEventListener('click', function(event) {
            event.preventDefault();
            addExpense();
        });

        document.getElementById('buttonDeleteExpense').addEventListener('click', function(event) {
            event.preventDefault();
            const expenseId = this.dataset.expenseId;
            deleteExpense(expenseId);
        });
    }


    const links = document.querySelectorAll('a');

    // Loop through all links
    links.forEach(link => {
        // Get the href attribute of the link
        const href = link.getAttribute('href');
        
        // Check if the href matches the current path
        if (href === currentPath) {
            // Get the <i> element inside the link
            const icon = link.querySelector('i');
            // Add the 'fill' class to the <i> element
            icon.classList.add('fill');
        }
    });
});