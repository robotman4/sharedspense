document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;

    document.getElementById('linkMenuLogout').addEventListener('click', function(event){
        event.preventDefault();
        logout();
    });

    // Execute functions depending on the current URL path
    switch (currentPath) {
        case '/client':
            break;
        case '/client/current':
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

            document.getElementById('buttonSaveArchive').addEventListener('click', function(event) {
                event.preventDefault();
                const archiveYearSubmitted = this.dataset.archiveYear;
                // Fetch the selected option for archive month and send it to the API function
                const selectArchiveMonth = document.getElementById('archiveMonthOptions');
                if (selectArchiveMonth) {
                    // Loop through the options to find the one matching the current month
                    for (let i = 0; i < selectArchiveMonth.options.length; i++) {
                        if (selectArchiveMonth.options[i].selected == true) {
                            archiveMonthSelected = selectArchiveMonth.options[i].value;
                            archiveExpenses(archiveMonthSelected);
                            break;
                        }
                    }
                }
            });
            break;
        case '/client/archive':
            break;
        default:
            // Default behavior
            break;
    }

    // Find all menulinks
    const links = document.querySelectorAll('.menulink');

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

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const inputArchiveYear = document.getElementById('archiveYear').value = currentYear;
    const selectArchiveMonth = document.getElementById('archiveMonthOptions');
    if (selectArchiveMonth) {
        // Loop through the options to find the one matching the current month
        for (let i = 0; i < selectArchiveMonth.options.length; i++) {
            if (selectArchiveMonth.options[i].value == currentMonth) {
                selectArchiveMonth.options[i].selected = true;
                break;
            }
        }
    }
});
