document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('linkLogout').addEventListener('click', function(event){
        event.preventDefault();
        logout();
    });
});

// TODO: make buttons highlighted dynamically based on selection