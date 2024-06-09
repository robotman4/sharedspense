document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('formLogin').addEventListener('submit', function(event) {
        event.preventDefault();
        login();
    });

    document.getElementById('dismissError').addEventListener('click', function() {
        const progress = document.getElementById('dialogProgress');
        progress.close();
    });
});