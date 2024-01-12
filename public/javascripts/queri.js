function toggleClasses() {
    var menuToggle = document.getElementById("menu_toggle");
    var topMobileMenu = document.querySelector(".top_mobile_menu_wr");

    // Adaugă clasa "open" la elementul cu id-ul "menu_toggle"
    menuToggle.classList.toggle("open");

    // Adaugă/înlătură clasa "active" la elementul cu clasa "top_mobile_menu_wr"
    topMobileMenu.classList.toggle("active");
}