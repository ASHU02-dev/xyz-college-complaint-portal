// ===============================
// UTILITIES
// ===============================
function escapeHTML(text) {
    return text.replace(/[&<>"']/g, function (match) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[match];
    });
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "#1f3c88";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "6px";
    toast.style.zIndex = "999";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ===============================
// AI ANALYSIS
// ===============================
function analyzeComplaint(text) {

    text = text.toLowerCase();

    let department = "General";
    let priority = "Low";
    let score = 40;

    if (text.includes("exam") || text.includes("marks") || text.includes("result")) {
        department = "Academic";
        priority = "Medium";
        score += 15;
    }

    if (text.includes("harassment") || text.includes("threat") || text.includes("abuse")) {
        department = "Discipline";
        priority = "High";
        score += 35;
    }

    if (text.includes("fan") || text.includes("electricity") || text.includes("water")) {
        department = "Infrastructure";
        priority = "Low";
        score += 10;
    }

    if (text.includes("hostel") || text.includes("mess")) {
        department = "Hostel";
        priority = "Medium";
        score += 20;
    }

    if (text.includes("urgent")) score += 15;
    if (text.length > 120) score += 15;

    if (score > 100) score = 100;

    let riskLevel = "Low";
    if (score > 75) riskLevel = "Critical";
    else if (score > 55) riskLevel = "Moderate";

    return { department, priority, score, riskLevel };
}

// ===============================
// INITIAL DATA
// ===============================
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

// DOM
const studentSection = document.getElementById("studentSection");
const adminSection = document.getElementById("adminSection");
const complaintForm = document.getElementById("complaintForm");
const userTableBody = document.getElementById("userTableBody");
const adminTableBody = document.getElementById("adminTableBody");

const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const closeModal = document.getElementById("closeModal");
const loginAdmin = document.getElementById("loginAdmin");
const loginError = document.getElementById("loginError");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const filterPriorityAdmin = document.getElementById("filterPriorityAdmin");

const exportPDFBtn = document.getElementById("exportPDF");
const exportCSVBtn = document.getElementById("exportCSV");

const darkToggle = document.getElementById("darkToggle");

// ===============================
// DARK MODE PROFESSIONAL
// ===============================

if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark");
    darkToggle.checked = true;
}

darkToggle.addEventListener("change", () => {

    if (darkToggle.checked) {
        document.body.classList.add("dark");
        localStorage.setItem("darkMode", "enabled");
    } else {
        document.body.classList.remove("dark");
        localStorage.removeItem("darkMode");
    }

});
// ===============================
// SUBMIT COMPLAINT
// ===============================
complaintForm.addEventListener("submit", e => {
    e.preventDefault();

    const name = escapeHTML(document.getElementById("name").value);
    const email = escapeHTML(document.getElementById("email").value);
    const text = escapeHTML(document.getElementById("complaintText").value);

    const ai = analyzeComplaint(text);

    const newComplaint = {
        id: "CMP" + Date.now(),
        name,
        email,
        department: ai.department,
        priority: ai.priority,
        text,
        status: "Under Review",
        riskScore: ai.score,
        riskLevel: ai.riskLevel
    };

    complaints.push(newComplaint);
    localStorage.setItem("complaints", JSON.stringify(complaints));

    complaintForm.reset();
    showToast("Complaint Submitted!");

    renderUserComplaints(email);
});

// ===============================
// USER TABLE
// ===============================
function renderUserComplaints(email) {
    userTableBody.innerHTML = "";

    complaints.filter(c => c.email === email).forEach(c => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${c.id}</td>
            <td>${c.priority}</td>
            <td>${c.status}</td>
            <td>${c.riskScore}%</td>
        `;
        userTableBody.appendChild(row);
    });
}

// ===============================
// ADMIN LOGIN
// ===============================
adminBtn.addEventListener("click", () => adminModal.style.display = "flex");
closeModal.addEventListener("click", () => adminModal.style.display = "none");

loginAdmin.addEventListener("click", () => {
    const username = document.getElementById("adminUser").value;
    const password = document.getElementById("adminPass").value;

    if (username === "admin" && password === "1234") {
        localStorage.setItem("isAdmin", "true");
        adminModal.style.display = "none";
        enableAdminMode();
        showToast("Admin Logged In");
    } else {
        loginError.textContent = "Invalid Credentials";
    }
});

// ===============================
// ENABLE ADMIN MODE
// ===============================
function enableAdminMode() {

    studentSection.style.display = "none";
    adminSection.style.display = "block";
    adminBtn.style.display = "none";

    if (!document.getElementById("logoutBtn")) {

        const logoutBtn = document.createElement("button");
        logoutBtn.textContent = "Logout";
        logoutBtn.id = "logoutBtn";
        logoutBtn.style.marginLeft = "10px";

        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("isAdmin");
            location.reload();
        });

        document.querySelector(".header-actions").appendChild(logoutBtn);
    }

    renderAdminTable();
    renderCharts();
}

// ===============================
// ADMIN TABLE
// ===============================
function renderAdminTable() {

    adminTableBody.innerHTML = "";

    let filtered = complaints;

    const searchVal = searchInput.value.toLowerCase();

    if (searchVal) {
        filtered = filtered.filter(c =>
            c.email.toLowerCase().includes(searchVal) ||
            c.id.toLowerCase().includes(searchVal)
        );
    }

    if (filterStatus.value !== "All") {
        filtered = filtered.filter(c => c.status === filterStatus.value);
    }

    if (filterPriorityAdmin.value !== "All") {
        filtered = filtered.filter(c => c.priority === filterPriorityAdmin.value);
    }

    filtered.forEach((c, index) => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>${c.email}</td>
            <td>${c.department}</td>
            <td>${c.priority}</td>
            <td>${c.status}</td>
            <td>${c.riskLevel} (${c.riskScore}%)</td>
            <td>
                <select data-index="${index}">
                    <option value="Under Review" ${c.status==="Under Review"?"selected":""}>Under Review</option>
                    <option value="Investigating" ${c.status==="Investigating"?"selected":""}>Investigating</option>
                    <option value="Resolved" ${c.status==="Resolved"?"selected":""}>Resolved</option>
                </select>
                <button data-delete="${index}">Delete</button>
            </td>
        `;

        adminTableBody.appendChild(row);
    });

    attachAdminEvents();
}

// ===============================
function attachAdminEvents() {

    document.querySelectorAll("#adminTableBody select").forEach(s => {
        s.addEventListener("change", function () {
            const idx = this.getAttribute("data-index");
            complaints[idx].status = this.value;
            localStorage.setItem("complaints", JSON.stringify(complaints));
            renderAdminTable();
            renderCharts();
        });
    });

    document.querySelectorAll("#adminTableBody button[data-delete]").forEach(b => {
        b.addEventListener("click", function () {
            const idx = this.getAttribute("data-delete");
            if (confirm("Delete complaint?")) {
                complaints.splice(idx, 1);
                localStorage.setItem("complaints", JSON.stringify(complaints));
                renderAdminTable();
                renderCharts();
            }
        });
    });
}

// ===============================
// SEARCH / FILTER
// ===============================
searchInput.addEventListener("input", renderAdminTable);
filterStatus.addEventListener("change", renderAdminTable);
filterPriorityAdmin.addEventListener("change", renderAdminTable);

// ===============================
// CHARTS
// ===============================
let statusChart, priorityChart;

function renderCharts() {

    const statusCounts = { "Under Review": 0, "Investigating": 0, "Resolved": 0 };
    const priorityCounts = { "High": 0, "Medium": 0, "Low": 0 };

    complaints.forEach(c => {
        statusCounts[c.status]++;
        priorityCounts[c.priority]++;
    });

    if (statusChart) statusChart.destroy();
    if (priorityChart) priorityChart.destroy();

    statusChart = new Chart(document.getElementById("statusChart"), {
        type: "bar",
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts)
            }]
        },
        options: { responsive: false, maintainAspectRatio: false }
    });

    priorityChart = new Chart(document.getElementById("priorityChart"), {
        type: "pie",
        data: {
            labels: Object.keys(priorityCounts),
            datasets: [{
                data: Object.values(priorityCounts)
            }]
        },
        options: { responsive: false, maintainAspectRatio: false }
    });
}

// ===============================
// EXPORT PDF
// ===============================
exportPDFBtn.addEventListener("click", () => {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("XYZ College - Complaint Report", 20, 15);

    let y = 25;

    complaints.forEach(c => {

        if (y > 270) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(10);
        doc.text(`ID: ${c.id}`, 10, y); y += 5;
        doc.text(`Name: ${c.name}`, 10, y); y += 5;
        doc.text(`Email: ${c.email}`, 10, y); y += 5;
        doc.text(`Department: ${c.department}`, 10, y); y += 5;
        doc.text(`Priority: ${c.priority}`, 10, y); y += 5;
        doc.text(`Status: ${c.status}`, 10, y); y += 5;
        doc.text(`Risk: ${c.riskScore}% (${c.riskLevel})`, 10, y);
        y += 10;

    });

    doc.save("complaints_report.pdf");
});

// ===============================
// EXPORT CSV
// ===============================
exportCSVBtn.addEventListener("click", () => {

    let csv = "ID,Name,Email,Department,Priority,Status,Risk\n";

    complaints.forEach(c => {
        csv += `${c.id},${c.name},${c.email},${c.department},${c.priority},${c.status},${c.riskScore}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "complaints.csv";
    link.click();
});

// ===============================
window.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("isAdmin") === "true")
        enableAdminMode();
});