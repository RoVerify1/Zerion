function navigate(page) {
    const content = document.getElementById("page-content");
    if(page === "home") {
        content.innerHTML = "<h1>Home</h1><p>Willkommen!</p>";
    } else if(page === "dashboard") {
        content.innerHTML = "<h1>Dashboard</h1><p>Deine Stats hier</p>";
    } else if(page === "staff") {
        content.innerHTML = "<h1>Staff Panel</h1><p>Staff Funktionen</p>";
    } else if(page === "admin") {
        content.innerHTML = "<h1>Admin Panel</h1><p>Alles sehen</p>";
    }
}
