const dashboardSidebar = document.getElementById("dashboardSidebar");
const userMenu = document.getElementById("userMenu");
const userMenuTrigger = document.getElementById("user-menu-trigger");
const userMenuDropdown = document.querySelector(".user-menu-dropdown");
const themeToggle = document.getElementById("theme-toggle");
const dashboardViews = document.querySelectorAll(".dashboard-view");
const dashboardNavItems = document.querySelectorAll(".dashboard-nav-item");
const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardSidebarOverlay = document.getElementById("dashboardSidebarOverlay");
const searchContainer = document.getElementById("searchContainer");
const searchInput = document.getElementById("searchInput");
const searchClose = document.getElementById("searchClose");
const mobileSearchBtn = document.getElementById("mobileSearchBtn");

// State
let sidebarCollapsed = false;
let currentView = "overview";

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initThemeToggle();
  initSidebar();
  initUserMenu();
  initNavigation();
  initCharts();
  initModal();
  initCalendar();
 
});

// ===================================
// SIDEBAR
// ===================================
function initSidebar() {
  sidebarCollapsed = localStorage.getItem("dashboard-sidebar-collapsed") === "true";
  dashboardSidebar?.classList.toggle("collapsed", sidebarCollapsed);

  document.querySelectorAll(".dashboard-sidebar-toggle").forEach((toggle) => {
    toggle.addEventListener("click", toggleSidebar);
  });

  dashboardSidebarOverlay?.addEventListener("click", closeSidebar);
}

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  const isMobile = window.innerWidth <= 1024;

  if (isMobile) {
    const isOpen = dashboardSidebar.classList.contains("collapsed");
    dashboardSidebar.classList.toggle("collapsed", !isOpen);
    dashboardSidebarOverlay?.classList.toggle("active", !isOpen);
  } else {
    dashboardSidebar?.classList.toggle("collapsed", sidebarCollapsed);
  }

  localStorage.setItem("dashboard-sidebar-collapsed", sidebarCollapsed.toString());
}

function closeSidebar() {
  if (window.innerWidth <= 1024) {
    dashboardSidebar?.classList.remove("collapsed");
    dashboardSidebarOverlay?.classList.remove("active");
  }
}

// ===================================
// USER MENU
// ===================================
function initUserMenu() {
  if (!userMenuTrigger || !userMenu) return;

  userMenuTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenu.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
      userMenu.classList.remove("active");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") userMenu.classList.remove("active");
  });
}

// ===================================
// NAVIGATION
// ===================================
function initNavigation() {
  dashboardNavItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const viewId = item.getAttribute("data-view");
      if (viewId) switchView(viewId);
    });
  });
}

function switchView(viewId) {
  dashboardNavItems.forEach((item) => {
    item.classList.toggle("active", item.getAttribute("data-view") === viewId);
  });

  dashboardViews.forEach((view) => view.classList.remove("active"));

  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add("active");
    currentView = viewId;
    updatePageTitle(viewId);
  }

  // ✅ FIX calendar when opening tasks
  if (viewId === "tasks") {
    setTimeout(() => {
      if (window.myCalendar) {
        window.myCalendar.updateSize();
      }
    }, 200);
  }

  if (window.innerWidth <= 1024) closeSidebar();
}

function updatePageTitle(viewId) {
  const titles = {
    overview: "Overview",
    projects: "Expenses", // renamed
    tasks: "Tasks",
    reports: "Reports",
    settings: "AI Chatbot",
  };

  if (dashboardTitle) {
    dashboardTitle.textContent = titles[viewId] || "Dashboard";
  }
}

// ===================================
// THEME
// ===================================
function initTheme() {
  const savedTheme = localStorage.getItem("dashboard-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeToggleUI(savedTheme);
}

function initThemeToggle() {
  if (!themeToggle) return;

  themeToggle.querySelectorAll(".theme-option").forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      setTheme(option.getAttribute("data-theme"));
    });
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("dashboard-theme", theme);
  updateThemeToggleUI(theme);
}

function updateThemeToggleUI(theme) {
  themeToggle?.querySelectorAll(".theme-option").forEach((option) => {
    option.classList.toggle("active", option.getAttribute("data-theme") === theme);
  });
}





// ===================================
// CHARTS
// ===================================
function initCharts() {
  initProgressChart();
  initCategoryChart();
}
function initProgressChart() {
  const ctx = document.getElementById("progressChart");
  if (!ctx) return;

  const monthlyData = {};

  cachedExpenses.forEach((exp) => {
    if (!exp.date || !exp.amount) return;

    // ✅ Handle both "D/M/YYYY" and "YYYY-MM-DD" formats
    let date;
    if (exp.date.includes("T") || exp.date.includes("-")) {
      // ISO format from backend: "2026-03-01T00:00:00"
      date = new Date(exp.date);
    } else {
      // Indian format: "1/3/2026" → split and rearrange to "2026-03-01"
      const parts = exp.date.split("/");
      date = new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`);
    }

    if (isNaN(date)) return;

    const month = date.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyData[month] = (monthlyData[month] || 0) + Number(exp.amount);
  });

  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    return new Date("1 " + a) - new Date("1 " + b);
  });

  const sortedValues = sortedMonths.map((m) => monthlyData[m]);

  if (window.progressChartInstance) window.progressChartInstance.destroy();

  window.progressChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sortedMonths,
      datasets: [{
        label: "Monthly Spending",
        data: sortedValues,
        backgroundColor: "#8b5cf6",
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            stepSize: 2000,
            callback: (val) => "Rs. " + Number(val).toLocaleString("en-IN") },
          grid: { color: "rgba(0,0,0,0.05)" },
        },
        x: { grid: { display: false } },
      },
    },
  });
}
function initCategoryChart() {
  const ctx = document.getElementById("categoryChart");
  if (!ctx) return;

  const rows = document.querySelectorAll("#expenseTableBody tr");

  let categoryData = {};

  rows.forEach(row => {
    const cols = row.querySelectorAll("td");

    if (cols.length > 0) {
      const amount = parseFloat(cols[0].innerText.replace("₹", ""));
      const category = cols[1].innerText;

      categoryData[category] = (categoryData[category] || 0) + amount;
    }
  });

  // destroy old chart (important)
  if (window.categoryChartInstance) {
    window.categoryChartInstance.destroy();
  }

  window.categoryChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(categoryData),
      datasets: [
        {
          data: Object.values(categoryData),
          backgroundColor: [
            "#8b5cf6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#3b82f6",
            "#ec4899"
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
      },
    },
  });
}


// ===================================
// ✅ MODAL (FIXED)
// ===================================
function initModal() {
  const modal = document.getElementById("expenseModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");

  // ✅ Only check required ones
  if (!modal || !openBtn) {
    console.error("Modal or Open button missing!");
    return;
  }

  // ✅ OPEN
  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // ✅ CLOSE (only if exists)
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  // ✅ OUTSIDE CLICK
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// ==========================
// EXPENSES CRUD SCRIPT
// ==========================

const token = localStorage.getItem("token");
if (!token) {
  alert("Please login first");
  window.location.href = "login.html?mode=login";
}

let editingExpenseId = null;
let cachedExpenses = []; // ✅ Store expenses in memory to avoid re-fetch on edit

// --------------------------
// DOM Helper
// --------------------------
function getEl(id) {
  return document.getElementById(id);
}

// --------------------------
// Modal Controls
// --------------------------
function openExpenseModal() {
  editingExpenseId = null;
  clearExpenseModal();
  getEl("expenseModalTitle").textContent = "Add Expense";
  getEl("expenseModal").style.display = "flex";
}

function closeExpenseModal() {
  getEl("expenseModal").style.display = "none";
  clearExpenseModal();
  editingExpenseId = null;
}

function clearExpenseModal() {
  getEl("amount").value = "";
  getEl("category").value = "";
  getEl("date").value = "";
  getEl("location").value = "";
}

// --------------------------
// Load All Expenses
// --------------------------
async function loadExpenses() {
  const tbody = getEl("expenseTableBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align:center; padding:20px; color:#888;">
        Loading expenses...
      </td>
    </tr>
  `;

  try {
    const res = await fetch("http://127.0.0.1:8000/expenses/my-expenses", {
      headers: { Authorization: "Bearer " + token },
    });

    if (res.status === 401) {
      alert("Session expired. Please login again.");
      window.location.href = "login.html?mode=login";
      return;
    }

    if (!res.ok) throw new Error("Failed to load expenses");

    const expenses = await res.json();
    cachedExpenses = expenses; // ✅ Save to memory
    renderExpenses(expenses);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:20px; color:red;">
          Failed to load expenses. Please try again.
        </td>
      </tr>
    `;
  }
}

// --------------------------
// Render Expenses Table
// --------------------------
function renderExpenses(expenses) {
  const tbody = getEl("expenseTableBody");
  if (!tbody) return;

  if (!expenses || expenses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:20px; color:#888;">
          No expenses found. Click "+ Add Expense" to get started.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  expenses.forEach((exp, index) => {
    // ✅ Log each expense _id to see exact structure
   

    // ✅ Handle all possible MongoDB _id formats
    // With this:
    const id = exp.id || exp._id || exp.expense_id;

    

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>₹${Number(exp.amount).toLocaleString("en-IN")}</td>
      <td>${exp.category || "-"}</td>
      <td>${exp.date ? new Date(exp.date).toLocaleDateString("en-IN") : "-"}</td>
      <td>${exp.receipt || "-"}</td>
      <td>
        <button class="btn btn-ghost edit-btn" data-id="${id}" title="Edit">
          <span class="material-symbols-rounded">edit</span>
        </button>
        <button class="btn btn-ghost delete-btn" data-id="${id}" title="Delete">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // ✅ Attach events AFTER all rows are appended
  tbody.querySelectorAll(".edit-btn").forEach((btn) => {
   
    btn.addEventListener("click", () => {
      
      editExpense(btn.dataset.id);
    });
  });

  tbody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteExpense(btn.dataset.id));
  });
  initCharts();
}

// --------------------------
// Edit Expense
// --------------------------
function editExpense(id) {


  // ✅ Find from memory — no extra fetch needed
const exp = cachedExpenses.find((e) => {
  const eId = e.id || e._id || e.expense_id; // ✅ same as renderExpenses
  return String(eId) === String(id);
});
  if (!exp) {
    console.error("Expense not found for id:", id);
    alert("Expense not found. Please refresh and try again.");
    return;
  }

  // ✅ Populate modal
  getEl("amount").value = exp.amount;
  getEl("category").value = exp.category || "";
  getEl("date").value = exp.date ? exp.date.split("T")[0] : "";
  getEl("location").value = exp.receipt || "";

  editingExpenseId = id;
  getEl("expenseModalTitle").textContent = "Edit Expense";
  getEl("expenseModal").style.display = "flex";
}

// --------------------------
// Add or Update Expense
// --------------------------
async function addExpense() {
  const amount = Number(getEl("amount").value);
  const category = getEl("category").value.trim();
  const date = getEl("date").value;
  const location = getEl("location").value.trim();

  if (!amount || amount <= 0) { alert("Please enter a valid amount."); return; }
  if (!category) { alert("Category is required."); return; }
  if (!date) { alert("Date is required."); return; }

  const payload = { amount, category, date, receipt: location, description: "" };

  let url = "http://127.0.0.1:8000/expenses/add";
  let method = "POST";

  if (editingExpenseId) {
    url = `http://127.0.0.1:8000/expenses/update/${editingExpenseId}`;
    method = "PUT";
  }

  const saveBtn = getEl("expenseSaveBtn");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Saving..."; }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to save expense");
    }

    closeExpenseModal();
    await loadExpenses();
  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Save"; }
  }
}

// --------------------------
// Delete Expense
// --------------------------
async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  try {
    const res = await fetch(`http://127.0.0.1:8000/expenses/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) throw new Error("Failed to delete expense");

    await loadExpenses();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// --------------------------
// Init
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  const openModalBtn = getEl("openModalBtn");
  const closeModalBtn = getEl("closeModalBtn");

  if (openModalBtn) openModalBtn.addEventListener("click", openExpenseModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeExpenseModal);

  // Close on backdrop click
  const modal = getEl("expenseModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeExpenseModal();
    });
  }

  loadExpenses();
});



// ===================================
// REPORTS
// ===================================
async function generateReportData() {
  // ✅ Fetch real user profile
  const res = await fetch("http://127.0.0.1:8000/users/profile", {
    headers: { Authorization: "Bearer " + token },
  });
  const profile = await res.json();

  const income = profile.salary || profile.income || profile.monthly_income || 0;

  let totalExpense = 0;
  const expenses = cachedExpenses.map((exp) => {
    totalExpense += Number(exp.amount);
    return {
      amount: Number(exp.amount),
      category: exp.category || "-",
      date: exp.date ? new Date(exp.date).toLocaleDateString("en-IN") : "-",
      balance: income - totalExpense,
    };
  });

  return {
    name: profile.name || "User",
    email: profile.email || "-",
    phone: profile.phone || "-",
    income,
    expenses,
    finalBalance: income - totalExpense,
  };
}

async function downloadCSV() {
  const report = await generateReportData();

  let csv = "";
  csv += `Name:,${report.name}\n`;
  csv += `Mail ID:,${report.email}\n`;
  csv += `Phone No:,${report.phone}\n\n`;
  csv += `Income,,Expenses,Category,Date,Balance\n`;

  if (report.expenses.length > 0) {
    csv += `${report.income},,${report.expenses[0].amount},${report.expenses[0].category},${report.expenses[0].date},${report.expenses[0].balance}\n`;
    for (let i = 1; i < report.expenses.length; i++) {
      const e = report.expenses[i];
      csv += `,,${e.amount},${e.category},${e.date},${e.balance}\n`;
    }
  }

  csv += `\n,,,,,Total Balance,${report.finalBalance}\n`;

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Expense_Report.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}

async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const report = await generateReportData();
  const today = new Date().toLocaleDateString("en-IN");

  // Title
  doc.setFontSize(16);
  doc.setTextColor(139, 92, 246);
  doc.text("Expense Tracker Report", 14, 15);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${today}`, 14, 22);

  // User details
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Name   : ${report.name}`, 14, 32);
  doc.text(`Email  : ${report.email}`, 14, 38);
  doc.text(`Phone  : ${report.phone}`, 14, 44);
  doc.text(`Income : Rs. ${Number(report.income).toLocaleString("en-IN")}`, 14, 50);

  // Table
  const tableData = report.expenses.map((e, index) => [
    index === 0 ? `Rs. ${Number(report.income).toLocaleString("en-IN")}` : "",
    `Rs. ${Number(e.amount).toLocaleString("en-IN")}`,
    e.category,
    e.date,
    `Rs. ${Number(e.balance).toLocaleString("en-IN")}`,
  ]);

  doc.autoTable({
    startY: 58,
    head: [["Income", "Expense", "Category", "Date", "Balance"]],
    body: tableData,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [139, 92, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  // Total
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(
    `Final Balance: Rs. ${Number(report.finalBalance).toLocaleString("en-IN")}`,
    14,
    doc.lastAutoTable.finalY + 10
  );

  doc.save("Expense_Report.pdf");
}

///CHAT
function getUserEmail() {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email || payload.sub || "";
  } catch {
    return "";
  }
}

function startChat() {
  document.getElementById("chatStartContainer").style.display = "none";
  document.getElementById("chatContainer").style.display = "block";
  addMessage("Hi! Ask me about your expenses 😊", "ai");
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  const typingId = "typing-" + Date.now();
  addMessage("Typing...", "ai", typingId);

  try {
    const res = await fetch("http://127.0.0.1:8000/chatbot/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        user_id: getUserEmail(), // ✅ pass user_id
        query: message,
      }),
    });

    if (!res.ok) throw new Error("Failed to get response");

    const data = await res.json();
    document.getElementById(typingId)?.remove();
    addMessage(data.answer, "ai"); // ✅ key is "answer"

  } catch (err) {
    document.getElementById(typingId)?.remove();
    addMessage("Sorry, I couldn't connect to the server.", "ai");
    console.error(err);
  }
}

// ✅ Send on Enter key
document.getElementById("chatInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

function addMessage(text, sender, id = null) {
  const chatBox = document.getElementById("chatMessages");
  const msgDiv = document.createElement("div");
  msgDiv.style.marginBottom = "10px";
  if (id) msgDiv.id = id;

  if (sender === "user") {
    msgDiv.innerHTML = `
      <div style="text-align:right;">
        <span style="background:#8b5cf6; color:#fff; padding:8px 12px; border-radius:10px; display:inline-block; max-width:80%;">
          ${text}
        </span>
      </div>
    `;
  } else {
    msgDiv.innerHTML = `
      <div style="text-align:left;">
        <span style="background:#f3f0ff; color:#1a1a1a; padding:8px 12px; border-radius:10px; display:inline-block; max-width:80%;">
          ${text}
        </span>
      </div>
    `;
  }

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
// Open modal & fetch profile from backend
async function openProfileModal() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html?mode=login";
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/users/profile", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("Failed to fetch profile");

    const profile = await res.json();

    document.getElementById("profileName").value = profile.name || "";
    document.getElementById("profileEmail").value = profile.email || "";
    document.getElementById("profilePhone").value = profile.phone || "";
    document.getElementById("profileSalary").value = profile.salary || "";
    document.getElementById("profilePassword").value = "";

    document.getElementById("profileModal").style.display = "flex";

  } catch (err) {
    console.error(err);
    alert("Unable to load profile");
  }
}

// Close modal
function closeProfileModal() {
  document.getElementById("profileModal").style.display = "none";
}

// Save updated profile to backend
async function saveProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html?mode=login";
    return;
  }

  const updateData = {
    name: document.getElementById("profileName").value,
    phone: document.getElementById("profilePhone").value,
    salary: Number(document.getElementById("profileSalary").value)
  };

  const newPassword = document.getElementById("profilePassword").value;
  if (newPassword) updateData.password = newPassword;

  try {
    const res = await fetch("http://127.0.0.1:8000/users/profile", {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updateData)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || "Failed to update profile");
    }

    const updatedProfile = await res.json();
    alert("Profile updated successfully!");
    closeProfileModal();
    console.log("Updated profile:", updatedProfile);


  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

 const logoutBtn = document.querySelector('.sidebar-back-button');

  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault(); // prevent default link behavior

    // Clear JWT token from localStorage
    localStorage.removeItem('token');

    // Optionally, clear all localStorage if needed
    // localStorage.clear();

    // Redirect to login page
    window.location.href = "login.html?mode=login";
  });

  async function loadDashboardUser() {
  const token = localStorage.getItem("token");
  if (!token) {
    // Not logged in → redirect to login
    window.location.href = "login.html?mode=login";
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/users/profile", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("Failed to fetch user profile");

    const user = await res.json();
    
    // Update dashboard title
    const titleEl = document.getElementById("dashboardTitle");
    titleEl.innerText = `Hi ${user.name}!!`;

  } catch (err) {
    console.error(err);
    alert("Unable to load user info. Please login again.");
    localStorage.removeItem("token");
    window.location.href = "login.html?mode=login";
  }
}

// Call on page load
window.onload = loadDashboardUser;


// ==========================
// OVERVIEW STATS SCRIPT
// ==========================

// --------------------------
// Load Overview Stats
// --------------------------
async function loadOverviewStats() {
  try {
    // ✅ Fetch both profile and expenses in parallel
    const [profileRes, expensesRes] = await Promise.all([
      fetch("http://127.0.0.1:8000/users/profile", {
        headers: { Authorization: "Bearer " + token },
      }),
      fetch("http://127.0.0.1:8000/expenses/my-expenses", {
        headers: { Authorization: "Bearer " + token },
      }),
    ]);

    if (profileRes.status === 401 || expensesRes.status === 401) {
      alert("Session expired. Please login again.");
      window.location.href = "login.html?mode=login";
      return;
    }

    if (!profileRes.ok) throw new Error("Failed to load profile");
    if (!expensesRes.ok) throw new Error("Failed to load expenses");

    const profile = await profileRes.json();
    const expenses = await expensesRes.json();

    // ✅ Get salary/income from profile
    const totalIncome = profile.salary || profile.income || profile.monthly_income || 0;

    // ✅ Sum all expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    // ✅ Calculate remaining balance
    const remainingBalance = totalIncome - totalExpenses;

    // ✅ Render into stat cards
    renderStats(totalIncome, totalExpenses, remainingBalance);
  } catch (err) {
    console.error("Failed to load overview stats:", err);
  }
}

// --------------------------
// Render Stats into Cards
// --------------------------
function renderStats(income, expenses, balance) {
  const statCards = document.querySelectorAll(".stat-card");

  // Card 1 — Total Income
  if (statCards[0]) {
    const valueEl = statCards[0].querySelector(".stat-card-value");
    if (valueEl) {
      valueEl.textContent = "₹" + Number(income).toLocaleString("en-IN");
    }
  }

  // Card 2 — Total Expenses
  if (statCards[1]) {
    const valueEl = statCards[1].querySelector(".stat-card-value");
    if (valueEl) {
      valueEl.textContent = "₹" + Number(expenses).toLocaleString("en-IN");
    }
  }

  // Card 3 — Remaining Balance
  if (statCards[2]) {
    const valueEl = statCards[2].querySelector(".stat-card-value");
    if (valueEl) {
      valueEl.textContent = "₹" + Number(balance).toLocaleString("en-IN");

      // ✅ Color balance red if negative
      valueEl.style.color = balance < 0 ? "#e74c3c" : "";
    }
  }
}

// --------------------------
// Init
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadOverviewStats();
});

// ===================================
// TASKS & CALENDAR
// ===================================

function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: 450,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    dateClick: function (info) {
      openTaskModal(info.dateStr);
    },
    eventClick: function (info) {
      if (confirm(`Delete task "${info.event.title}"?`)) {
        deleteTask(info.event.id);
        info.event.remove();
      }
    },
  });

  calendar.render();
  window.myCalendar = calendar;

  setTimeout(() => {
    calendar.updateSize();
    loadTasks();
  }, 300);
}

function openTaskModal(dateStr) {
  document.getElementById("taskModal").style.display = "flex";
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskTime").value = dateStr ? dateStr + "T10:00" : "";
}

function closeTaskModal() {
  document.getElementById("taskModal").style.display = "none";
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskTime").value = "";
}

async function loadTasks() {
  try {
    const res = await fetch("http://127.0.0.1:8000/tasks/my-tasks", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error("Failed to load tasks");
    const tasks = await res.json();
    tasks.forEach((task) => {
      if (window.myCalendar) {
        window.myCalendar.addEvent({
          id: task.id,
          title: task.title,
          start: task.start,
        });
      }
    });
    scheduleAlerts(tasks);
  } catch (err) {
    console.error("Failed to load tasks:", err);
  }
}

async function saveTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const time = document.getElementById("taskTime").value;

  if (!title || !time) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/tasks/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        title,
        start: time,
        user_id: getUserEmail(),
      }),
    });

    if (!res.ok) throw new Error("Failed to save task");

    const data = await res.json();

    if (window.myCalendar) {
      window.myCalendar.addEvent({
        id: data.id,
        title,
        start: time,
      });
    }

    scheduleAlerts([{ title, start: time }]);
    closeTaskModal();
    alert(`Task "${title}" saved!`);

  } catch (err) {
    console.error(err);
    alert("Failed to save task. Please try again.");
  }
}

async function deleteTask(id) {
  try {
    await fetch(`http://127.0.0.1:8000/tasks/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
  } catch (err) {
    console.error("Failed to delete task:", err);
  }
}

function playAlertSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // ✅ Repeating beep pattern like a ringtone
  const beepPattern = [
    { freq: 880, start: 0.0, duration: 0.15 },
    { freq: 880, start: 0.2, duration: 0.15 },
    { freq: 880, start: 0.4, duration: 0.15 },
    { freq: 1100, start: 0.7, duration: 0.3 },
    { freq: 880, start: 1.1, duration: 0.15 },
    { freq: 880, start: 1.3, duration: 0.15 },
    { freq: 1100, start: 1.6, duration: 0.4 },
    { freq: 880, start: 2.1, duration: 0.15 },
    { freq: 880, start: 2.3, duration: 0.15 },
    { freq: 880, start: 2.5, duration: 0.15 },
    { freq: 1100, start: 2.8, duration: 0.5 },
  ];

  beepPattern.forEach(({ freq, start, duration }) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + start);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + start);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);

    oscillator.start(audioCtx.currentTime + start);
    oscillator.stop(audioCtx.currentTime + start + duration);
  });
}

function scheduleAlerts(tasks) {
  tasks.forEach((task) => {
    const taskTime = new Date(task.start).getTime();
    const now = Date.now();
    const diff = taskTime - now;

    const alertTime = diff - 10 * 60 * 1000;
    if (alertTime > 0) {
      setTimeout(() => {
        playAlertSound();
        alert(`⏰ Reminder: "${task.title}" starts in 10 minutes!`);
      }, alertTime);
    }

    if (diff > 0) {
      setTimeout(() => {
        playAlertSound();
        alert(`🔔 Task Starting Now: "${task.title}"`);
      }, diff);
    }
  });
}