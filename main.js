document.addEventListener("DOMContentLoaded", function () {
  // ==========================================================================
  //  INITIALIZATION (Variables and DOM Elements)
  // ==========================================================================

  const navigationLinks = document.querySelectorAll(".nav-link");
  const mainContentSections = document.querySelectorAll(".content-section");
  const productInformationTable = document.querySelector("#information");
  const newProductModal = new bootstrap.Modal(
    document.getElementById("addProductModal")
  );
  const newProductForm = document.querySelector("#productForm");
  const productSearchInput = document.getElementById("search-produit");
  const productSaveButton = document.querySelector("#adding-product");
  const newproduct = document.querySelector(".new-operation")


  let currentProductId = null;
  let productList = [];
  let filteredProductList = [];

  const inventoryDateInput = document.querySelector("#stockDate");
  const inventoryProductListContainer = document.getElementById("productList");
  const inventorySelectProductDropdown = document.querySelector("#selectProduct");
  const inventoryProductQuantityInput = document.querySelector("#productQuantity");
  const inventoryNameInput = document.querySelector("#stock_nom");

  let inventoryProductArray = [];

  const inventoryTableBody = document.querySelector("#stockTableBody");
  let inventoryOperations = [];
  let currentInventoryOperationIndex = null;

  const salesTableBody = document.querySelector("#venteTableBody");

  // ADDED :  Make sure to declare to work
  const salesNameInput = document.querySelector("#vente_nom");
  const salesDateInput = document.querySelector("#venteDate");

  const salesProductListContainer = document.querySelector("#venteProductList");
  const salesSelectProductDropdown = document.querySelector("#selectVenteProduct");
  const salesProductQuantityInput = document.querySelector("#venteProductQuantity");
  const searchsells = document.getElementById("#searchVenteProduct");
  const searchVenteProduct = document.getElementById("searchVenteProduct")
  const newvent = document.querySelector(".new-operation-vente")
  let salesProductArray = [];

  // STOCK SEARCH START
  const searchStockInput = document.getElementById("searchStockProduct");
  let displayedInventoryOperations = [];

  // STOCK SEARCH END

  // ADDED : Also we must declare
  let venteOperations = [];

  // Vente Search Functionality
  const searchVenteInput = document.getElementById("searchVenteProduct");
  let displayedVenteOperations = [];

  //ADD A BOOLEAN to control and know if is an add an update
  let isAnUpdate = false;
  // ==========================================================================
  //  UTILITY FUNCTIONS (Navigation, Displaying Content)
  // ==========================================================================

  function displaySection(sectionId) {
    mainContentSections.forEach((section) => section.classList.remove("active"));
    navigationLinks.forEach((link) => link.classList.remove("active"));

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
      activeSection.classList.add("active");
    }

    navigationLinks.forEach((link) => {
      if (link.getAttribute("data-target") === sectionId) {
        link.classList.add("active");
      }
    });
  }

  // ==========================================================================
  //  EVENT LISTENERS (Navigation, Modals)
  // ==========================================================================

  navigationLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const targetSection = this.getAttribute("data-target");
      if (targetSection) {
        localStorage.setItem("activeSection", targetSection);
        displaySection(targetSection);
      }
    });
  });

  newvent.addEventListener("click", () => {
    salesDateInput.value = "";
    salesNameInput.value = "";
    salesProductQuantityInput.value = "";
    salesProductListContainer.innerHTML = "";

  })
  newproduct.addEventListener("click", () => {
    inventoryNameInput.innerHTML = "";
    inventoryDateInput.innerHTML = "";
    inventoryProductQuantityInput.innerHTML = ""
  })

  const initialSection = localStorage.getItem("activeSection") || "dashboard";
  displaySection(initialSection);

  // We must to  set update to false so it doesnt block creation.
  const addProductButton = document.querySelector(".new-product");
  addProductButton.addEventListener("click", function () {
    currentProductId = null;
    document.getElementById("productName").value = "";
    newProductModal.show();

    //Set update to false
    isAnUpdate = false;
  });

  // ==========================================================================
  //  DASHBOARD (Chart - Dummy Data)
  // ==========================================================================



  const mySalesData = [
    { month: "Janvier", sales: 0 },
    { month: "Février", sales: 0 },
    { month: "Mars", sales: 0 },
    { month: "Avril", sales: 0 },
    { month: "Juin", sales: 0 },
    { month: "Juillet", sales: 0 },
    { month: "Août", sales: 0 },
    { month: "Septembre", sales: 1 },
    { month: "Octobre", sales: 20 },
    { month: "Novembre", sales: 25 },
    { month: "Décembre", sales: 30 },
  ];

  const ctx = document.getElementById("salesChart").getContext("2d");
  const labels = mySalesData.map((item) => item.month);
  const dataPoints = mySalesData.map((item) => item.sales);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Ventes par mois",
        data: dataPoints,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const config = {
    type: "line",
    data: data,
  };

  const myChart = new Chart(ctx, config);


  // ==========================================================================
  //  SIDEBAR (Toggling)
  // ==========================================================================

  const sidebar = document.querySelector(".sidebar");
  const sidebarToggleButton = document.querySelector(".sidebar-toggler");
  const menuToggleButton = document.querySelector(".menu-toggler");
  const collapsedSidebarHeight = "85px";
  const fullSidebarHeight = "calc(100% - 10px)";

  sidebarToggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  const toggleMenu = (isMenuActive) => {
    sidebar.style.height = isMenuActive
      ? `${sidebar.scrollHeight}px`
      : collapsedSidebarHeight;
    menuToggleButton.querySelector("span").innerText = isMenuActive ? "Close" : "Menu";
  };

  menuToggleButton.addEventListener("click", () => {
    toggleMenu(sidebar.classList.toggle("menu-active"));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 765) {
      sidebar.style.height = fullSidebarHeight;
    } else {
      sidebar.style.height = "auto";
      sidebar.classList.remove("collapsed");
      toggleMenu(sidebar.classList.contains("menu-active"));
    }
  });

  // ==========================================================================
  //  PRODUCTS (CRUD Operations - Create, Read, Update, Delete)
  // ==========================================================================

  async function fetchProducts() {
    try {
      const response = await fetch("http://localhost:3000/products");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      productList = await response.json();
      filteredProductList = [...productList];
      renderProducts(filteredProductList);
      populateSelectProductDropdown();
      populateSalesSelectProductDropdown();
    } catch (error) {
      console.error("Error fetching products:", error);
      Swal.fire("Error!", "Failed to load products.", "error");
    }
  }

  async function createProduct() {
    const productNameInput = document.querySelector("#productName");
    if (!productNameInput || productNameInput.value.trim() === "") {
      Swal.fire("Error!", "Product name cannot be empty!", "error");
      return;
    }
    const newproduct = { title: productNameInput.value.trim() };

    try {
      const response = await fetch("http://localhost:3000/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newproduct),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }


      Swal.fire("Success!", "Product added successfully!", "success");
      productNameInput.value = "";
      await fetchProducts();
      newProductModal.hide();
      refreshAllSections();
    } catch (error) {
      console.error("Error adding product:", error);
      Swal.fire("Error!", "Failed to add product.", "error");
    }
  }

  async function removeProduct(productId) {
    try {
      // 1. Delete the product
      const productDeleteResponse = await fetch(`http://localhost:3000/products/${productId}`, {
        method: "DELETE",
      });

      if (!productDeleteResponse.ok) {
        throw new Error(`HTTP error deleting product! Status: ${productDeleteResponse.status}`);
      }

      // 2. Update stock operations (client-side)

      inventoryOperations = inventoryOperations.map((stock) => {
        const newArticles = stock.articles.filter((article) => article.product !== productId);
        return { ...stock, articles: newArticles, numberOfProducts: newArticles.length };
      });


      // 3. Call server to also update stock operation (API CHANGE REQUIRED)
      const updateStockOperationsResponse = await fetch(`http://localhost:3000/stock-operations/byProduct/${productId}`, {
        method: "DELETE",
      });

      if (!updateStockOperationsResponse.ok) {
        throw new Error(`HTTP error deleting product from stock operations! Status: ${productDeleteResponse.status}`);
      }

      fetchProducts();
      fetchInventoryOperations();

    } catch (error) {
      console.error("Error deleting product:", error);
      Swal.fire("Error!", "Failed to delete product and update stock.", "error");
    }
  }

  async function updateProduct(productId, newTitle) {
    if (!newTitle || newTitle.trim() === "") {
      Swal.fire("Error!", "Product title cannot be empty!", "error");
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      fetchProducts();
      refreshAllSections();
    } catch (error) {
      console.error("Error updating product:", error);
      Swal.fire("Error!", "Failed to update product.", "error");
    }
  }

  function renderProducts(productsToDisplay) {
    let table = "";

    for (let i = 0; i < productsToDisplay.length; i++) {
      const stocks = productsToDisplay[i].stocks || 0;
      const sells = productsToDisplay[i].sells || 0;

      table += `
            <tr>
              <td>${i + 1}</td>
              <td>${productsToDisplay[i].title}</td>
              <td>${stocks}</td>
              <td>${sells}</td>
              <td>
                <button class="btn btn-outline-success edit-product-btn" data-product-id="${productsToDisplay[i]._id}">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn btn-outline-danger delete-product-btn" data-product-id="${productsToDisplay[i]._id}">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </td>
            </tr>
          `;
    }

    productInformationTable.innerHTML = table;
    attachProductEventListeners();
  }

  function attachProductEventListeners() {
    document.querySelectorAll(".delete-product-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const productId = this.dataset.productId;
        Swal.fire({
          title: "Are you sure?",
          text: "You won't be able to revert this!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
          if (result.isConfirmed) {
            await removeProduct(productId);
            Swal.fire("Deleted!", "Your product has been deleted.", "success");
            refreshAllSections();
          }
        });
      });
    });

    document.querySelectorAll(".edit-product-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        // Fix: Use `this.dataset.productId` instead of `this.dataset.productId._id`
        const productId = this.dataset.productId;
        const product = productList.find((p) => p._id === productId);

        if (!product) {
          Swal.fire("Error!", "Product not found.", "error");
          return;
        }

        Swal.fire({
          title: "Edit Product",
          input: "text",
          inputValue: product.title || "", // Fallback to empty string if title is undefined
          showCancelButton: true,
          confirmButtonText: "Update",
          cancelButtonText: "Cancel",
          inputValidator: (newTitle) => {
            // Validate the input
            if (!newTitle || newTitle.trim() === "") {
              return "Title cannot be empty!";
            }
            return null; // Return null if the input is valid
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              // Call the `updateProduct` function to update the product
              await updateProduct(productId, result.value);

              // Refresh all sections to reflect the updated product
              refreshAllSections();

              // Show success message
              Swal.fire("Updated!", "Product updated successfully.", "success");
            } catch (error) {
              console.error("Error updating product:", error);
              Swal.fire("Error!", "Failed to update product.", "error");
            }
          }
        });
      });
    });
  }
  productSearchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase().trim();

    filteredProductList = productList.filter((product) =>
      product.title.toLowerCase().includes(searchTerm)
    );

    renderProducts(filteredProductList);
  });

  productSaveButton.addEventListener("click", () => {
    createProduct();
  });

  // ==========================================================================
  //  STOCK OPERATIONS (CRUD Operations)
  // ==========================================================================

  function addProductToInventoryList() {
    const productId = inventorySelectProductDropdown.value;
    const productName =
      inventorySelectProductDropdown.options[inventorySelectProductDropdown.selectedIndex].text;
    const quantityStr = inventoryProductQuantityInput.value;

    if (!productId) {
      Swal.fire("Warning!", "Please select a product.", "warning");
      return;
    }

    const quantity = parseInt(quantityStr);
    if (isNaN(quantity) || quantity <= 0) {
      Swal.fire("Warning!", "Please enter a valid quantity (greater than 0).", "warning");
      inventoryProductQuantityInput.value = 1;
      return;
    }

    const productItem = document.createElement("div");
    productItem.dataset.productId = productId;
    productItem.dataset.quantity = quantity;
    productItem.classList.add(
      "product-item",
      "d-flex",
      "justify-content-between",
      "align-items-center",
      "bg-light",
      "p-2",
      "rounded",
      "mb-2"
    );


    productItem.innerHTML = `
      <span>${productName}</span>
      <div>
        <span class="quantity me-2">${quantity}</span>
        <button type="button" class="btn btn-sm btn-outline-danger remove-product" aria-label="Supprimer produit">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    `;

    inventoryProductListContainer.appendChild(productItem);
    inventorySelectProductDropdown.value = "";
    inventoryProductQuantityInput.value = 1;

    const removeButton = productItem.querySelector(".remove-product");
    removeButton.addEventListener("click", function () {
      inventoryProductListContainer.removeChild(productItem);
    });

    updateInventoryProductArray(productId, quantity);
  }

  function updateInventoryProductArray(productId, quantity) {
    const product = productList.find((product) => product._id === productId);

    const existingProductIndex = inventoryProductArray.findIndex(
      (item) => item.product === productId
    );

    if (existingProductIndex !== -1) {
      inventoryProductArray[existingProductIndex].quantity = quantity;
      inventoryProductArray[existingProductIndex].title = product.title;
    } else {
      inventoryProductArray.push({ product: productId, quantity: quantity, title: product.title });
    }
    generateInventoryTable(inventoryProductArray);
  }

  function generateInventoryTable(inventoryProductArray) {
    const tableContainer = document.getElementById("selectedProductTable");
    if (tableContainer) {
      tableContainer.innerHTML = "";

      if (inventoryProductArray.length > 0) {
        const table = document.createElement("table");
        table.classList.add("table", "table-striped", "table-bordered");

        const thead = document.createElement("thead");
        thead.classList.add("thead-dark");
        const headerRow = document.createElement("tr");
        const headers = ["Product Name", "Quantity"];

        headers.forEach((headerText) => {
          const th = document.createElement("th");
          th.textContent = headerText;
          headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        inventoryProductArray.forEach((product) => {
          const row = document.createElement("tr");
          const productNameCell = document.createElement("td");
          productNameCell.textContent = product.title;
          const quantityCell = document.createElement("td");
          quantityCell.textContent = product.quantity;

          row.appendChild(productNameCell);
          row.appendChild(quantityCell);
          tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tableContainer.appendChild(table);
      } else {
        const message = document.createElement("p");
        message.textContent = "No products selected.";
        tableContainer.appendChild(table);
      }
    }
  }

  async function saveInventoryOperation() {
    const articles = Array.from(inventoryProductListContainer.children).map((item) => {
      const productId = item.dataset.productId;
      let quantity = parseInt(item.dataset.quantity);
      return { product: productId, quantity: quantity };
    });

    if (!inventoryNameInput.value || !inventoryDateInput.value) {
      Swal.fire("Warning!", "Please fill all fields.", "warning");
      return;
    }

    if (articles.length === 0) {
      Swal.fire("Warning!", "Please select at least one product.", "warning");
      return;
    }

    const formattedDate = formatDate(inventoryDateInput.value);
    if (!formattedDate) {
      Swal.fire("Error!", "Invalid date format.", "error");
      return;
    }

    const stockInputs = {
      name: inventoryNameInput.value,
      date: formattedDate,
      articles: articles,
      numberOfProducts: articles.length,
    };

    try {
      let response;
      if (currentInventoryOperationIndex !== null) {
        const stockId = inventoryOperations[currentInventoryOperationIndex]._id;
        response = await fetch(`http://localhost:3000/stock-operations/${stockId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stockInputs),
        });
      } else {
        response = await fetch("http://localhost:3000/stock-operations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stockInputs),
        });
      }


      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      Swal.fire("Success!", "Stock operation added successfully!", "success");
    } catch (error) {
      console.error("Error creating stock operation:", error);
      Swal.fire("Error!", "Failed to add stock operation.", "error");
    } finally {
      inventoryProductListContainer.innerHTML = "";
      inventoryProductArray = [];
      generateInventoryTable(inventoryProductArray);
      clearInventoryOperationForm();

      fetchProducts();
      fetchInventoryOperations();
      refreshAllSections();
    }
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;  // Invalid date
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return null;
    }
  }

  newproduct.addEventListener("click", () => {
    inventoryNameInput.value = "";
    inventoryDateInput.value = "";
    inventoryProductListContainer.innerHTML = ""; // Clear the product list
    inventoryProductArray = []; // Clear the product array
    generateInventoryTable(inventoryProductArray);
    console.log("Inventory operation form cleared!"); // Add a log to confirm it's called
  })



  async function fetchInventoryOperations() {
    try {
      const response = await fetch("http://localhost:3000/stock-operations");

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      inventoryOperations = await response.json();
      displayedInventoryOperations = [...inventoryOperations]; // Initialize displayed data
      renderInventoryOperations(displayedInventoryOperations);
    } catch (error) {
      console.error("Error fetching stock operations:", error);
      Swal.fire("Error!", "Failed to fetch stock operations.", "error");
    }
  }

  function renderInventoryOperations(stockOperationsToRender) {
    // 1. حذف العمليات التي تحتوي على id يساوي null

    // 2. عرض الجدول بعد الحذف
    let table = "";

    for (let i = 0; i < stockOperationsToRender.length; i++) {
      const formattedDate = formatDateForDisplay(stockOperationsToRender[i].date);
      const numberOfArticles = stockOperationsToRender[i].articles.length;

      table += `
        <tr>
          <td>${i + 1}</td>
          <td>${stockOperationsToRender[i].name}</td>
          <td>${formattedDate}</td>
          <td>${numberOfArticles}</td>
          <td>
            <button class="btn btn-outline-success edit-stock-btn" data-stock-id="${stockOperationsToRender[i]._id}" data-index="${i}">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="btn btn-outline-dark view-stock-btn" data-stock-id="${stockOperationsToRender[i]._id}">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="btn btn-outline-danger delete-stock-btn" data-stock-id="${stockOperationsToRender[i]._id}">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </td>
        </tr>
      `;
    }

    // 3. تحديث واجهة المستخدم
    inventoryTableBody.innerHTML = table;
    attachInventoryEventListeners();
  }

  function formatDateForDisplay(isoString) {
    if (!isoString) return ''; // Handle null or undefined dates

    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", isoString);
        return 'Invalid Date'; // Or some other error indicator
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  }

  function attachInventoryEventListeners() {
    document.querySelectorAll(".delete-stock-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const stockId = this.dataset.stockId;

        Swal.fire({
          title: "Are you sure?",
          text: "You won't be able to revert this!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
          if (result.isConfirmed) {
            await deleteInventoryOperation(stockId);
            Swal.fire("Deleted!", "Your stock operation has been deleted.", "success");
            refreshAllSections();
          }
        });
      });
    });

    document.querySelectorAll(".edit-stock-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const stockId = this.dataset.stockId;
        const stockOperationIndex = this.dataset.index;
        const stockOperation = inventoryOperations.find((s) => s._id === stockId);

        // التحقق من بيانات العملية
        console.log("Stock Operation Data:", stockOperation);

        // تعيين القيم في حقول النموذج
        inventoryNameInput.value = stockOperation.name;

        //Change
        isAnUpdate = true;

        // تحويل التاريخ إلى تنسيق YYYY-MM-DD
        const isoDate = stockOperation.date;
        const formattedDate = isoDate.split('T')[0];
        inventoryDateInput.value = formattedDate;

        // التحقق من القيم المعينة
        console.log("Name Input Value:", inventoryNameInput.value);
        console.log("Date Input Value:", inventoryDateInput.value);

        // مسح القائمة الحالية
        inventoryProductListContainer.innerHTML = "";

        // إضافة المنتجات الجديدة
        stockOperation.articles.forEach((article) => {
          console.log("Article Product:", article.product); // التحقق من هيكل article.product

          // استخراج معرف المنتج إذا كان article.product كائنًا
          const productId = article.product._id || article.product;
          const product = productList.find((p) => p._id === productId);

          if (product) {
            console.log("Adding Product:", product.title, "Quantity:", article.quantity);
            addProductToInventoryListForEdit(product._id, product.title, article.quantity);
          } else {
            console.error("Product not found:", productId);
          }
        });

        // التحقق من المنتجات المضافة
        console.log("Products in List:", inventoryProductListContainer.innerHTML);

        // تعيين الفهرس الحالي للعملية
        currentInventoryOperationIndex = stockOperationIndex;

        // فتح المودال
        const editStockModal = new bootstrap.Modal(document.getElementById('modalNewStockOperation'));
        editStockModal.show();
      });

    });

    document.querySelectorAll(".view-stock-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const stockId = this.dataset.stockId;
        const stockOperation = inventoryOperations.find((s) => s._id === stockId);

        if (!stockOperation) {
          Swal.fire("Error!", "Stock operation not found.", "error");
          return;
        }

        console.log("Stock Operation:", stockOperation);

        // Fix: Access stock name directly
        let message = `<p><strong>Name:</strong> ${stockOperation.name || "Unknown"}</p>`;
        message += `<p><strong>Date:</strong> ${formatDateForDisplay(stockOperation.date)}</p>`;
        message += `<h5>Articles:</h5>`;

        if (stockOperation.articles && stockOperation.articles.length > 0) {
          message += '<ul>';

          stockOperation.articles.forEach((article) => {
            console.log("Article Product ID:", article.product, "or", article.product_id);

            // Fix: Ensure correct ID matching
            const product = productList.find((p) => {
              // Check if `article.product` is an object with `_id` or a direct ID
              const productId = article.product?._id || article.product || article.product_id;
              return String(p._id) === String(productId) || String(p.id) === String(productId);
            });

            if (product) {
              message += `<li>${product.title || "Unnamed Product"} - Quantity: ${article.quantity || 0}</li>`;
            } else {
              message += `<li>Product not found - Quantity: ${article.quantity || 0}</li>`;
            }
          });

          message += '</ul>';
        } else {
          message += `<p>No articles found.</p>`;
        }

        Swal.fire({
          title: "Stock Operation Details",
          html: message,
          showCloseButton: true,
          didOpen: () => {
            const popup = Swal.getPopup();
            popup.classList.add('swal-wide');
          },
        });
      });
    });
  }

  async function deleteInventoryOperation(stockId) {
    try {
      const response = await fetch(
        `http://localhost:3000/stock-operations/${stockId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      fetchInventoryOperations();
      refreshAllSections();
    } catch (error) {
      console.error("Error deleting stock operation:", error);
      Swal.fire("Error!", "Failed to delete stock operation.", "error");
    }
  }

  function addProductToInventoryListForEdit(productId, productName, quantity) {
    const productItem = document.createElement("div");
    productItem.dataset.productId = productId;
    productItem.dataset.quantity = quantity;
    productItem.classList.add(
      "product-item",
      "d-flex",
      "justify-content-between",
      "align-items-center",
      "bg-light",
      "p-2",
      "rounded",
      "mb-2"
    );

    productItem.innerHTML = `
          <span>${productName}</span>
          <div>
            <span class="quantity me-2">${quantity}</span>
            <button type="button" class="btn btn-sm btn-outline-danger remove-product" aria-label="Supprimer produit">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        `;

    inventoryProductListContainer.appendChild(productItem);
    updateInventoryProductArray(productId, quantity);
  }

  // ==========================================================================
  //  VENTE OPERATIONS (CRUD Operations)
  // ==========================================================================

  function addProductToSalesList() {
    const productId = salesSelectProductDropdown.value;
    const productName =
      salesSelectProductDropdown.options[salesSelectProductDropdown.selectedIndex].text;
    const quantityStr = salesProductQuantityInput.value;

    if (!productId) {
      Swal.fire("Warning!", "Please select a product.", "warning");
      return;
    }

    const quantity = parseInt(quantityStr);
    if (isNaN(quantity) || quantity <= 0) {
      Swal.fire("Warning!", "Please enter a valid quantity (greater than 0).", "warning");
      salesProductQuantityInput.value = 1;
      return;
    }

    const productItem = document.createElement("div");
    productItem.dataset.productId = productId;
    productItem.dataset.quantity = quantity;
    productItem.classList.add(
      "product-item",
      "d-flex",
      "justify-content-between",
      "align-items-center",
      "bg-light",
      "p-2",
      "rounded",
      "mb-2"
    );

    productItem.innerHTML = `
      <span>${productName}</span>
      <div>
        <span class="quantity me-2">${quantity}</span>
        <button type="button" class="btn btn-sm btn-outline-danger remove-product" aria-label="Supprimer produit">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    `;

    salesProductListContainer.appendChild(productItem);
    salesSelectProductDropdown.value = "";
    salesProductQuantityInput.value = 1;

    const removeButton = productItem.querySelector(".remove-product");
    removeButton.addEventListener("click", function () {
      salesProductListContainer.removeChild(productItem);
    });

    updateSalesProductArray(productId, quantity);
  }

  function updateSalesProductArray(productId, quantity) {
    const product = productList.find((product) => product._id === productId);

    const existingProductIndex = salesProductArray.findIndex(
      (item) => item.product === productId
    );

    if (existingProductIndex !== -1) {
      salesProductArray[existingProductIndex].quantity = quantity;
      salesProductArray[existingProductIndex].title = product.title;
    } else {
      salesProductArray.push({ product: productId, quantity: quantity, title: product.title });
    }
    generateSalesTable(salesProductArray);
  }

  function generateSalesTable(salesProductArray) {
    const tableContainer = document.getElementById("selectedVenteTable");
    if (tableContainer) {
      tableContainer.innerHTML = "";

      if (salesProductArray.length > 0) {
        const table = document.createElement("table");
        table.classList.add("table", "table-striped", "table-bordered");

        const thead = document.createElement("thead");
        thead.classList.add("thead-dark");
        const headerRow = document.createElement("tr");
        const headers = ["Product Name", "Quantity"];

        headers.forEach((headerText) => {
          const th = document.createElement("th");
          th.textContent = headerText;
          headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        salesProductArray.forEach((product) => {
          const row = document.createElement("tr");
          const productNameCell = document.createElement("td");
          productNameCell.textContent = product.title;
          const quantityCell = documentcreateElement("td");
          quantityCell.textContent = product.quantity;

          row.appendChild(productNameCell);
          row.appendChild(quantityCell);
          tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tableContainer.appendChild(table);
      } else {
        const message = document.createElement("p");
        message.textContent = "No products selected.";
        tableContainer.appendChild(message);
      }
    } else {
      console.error("Table container element with ID 'selectedVenteTable' not found.");
    }
  }

  async function saveSalesReport() {
    if (!salesNameInput.value || !salesDateInput.value) {
      Swal.fire("Warning!", "Please fill all Sales fields.", "warning");
      return;
    }
    const articles = Array.from(salesProductListContainer.children).map((item) => {
      const productId = item.dataset.productId;
      let quantity = parseInt(item.dataset.quantity);
      return { product: productId, quantity: quantity };
    });

    if (articles.length === 0) {
      Swal.fire("Warning!", "Please select at least one product for sale.", "warning");
      return;
    }

    const formattedDate = formatDate(salesDateInput.value);
    if (!formattedDate) {
      Swal.fire("Error!", "Invalid date format for sales.", "error");
      return;
    }

    const venteInputs = {
      name: salesNameInput.value,
      date: formattedDate,
      articles: articles,
      numberOfProducts: articles.length,
    };

    try {
      let response = await fetch("http://localhost:3000/sell-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venteInputs),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      Swal.fire("Success!", "Sales operation added successfully!", "success");
    } catch (error) {
      console.error("Error creating sales operation:", error);
      Swal.fire("Error!", "Failed to add sales operation.", "error");
    } finally {

      clearSalesFormAfterSave()
      fetchProducts();
      fetchSalesReports();
      refreshAllSections();
    }
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;  // Invalid date
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return null;
    }
  }


  async function fetchSalesReports() {
    try {
      const response = await fetch("http://localhost:3000/sell-operations");

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      venteOperations = await response.json();
      displayedVenteOperations = [...venteOperations]; // Initialize displayed data
      renderSalesReports(displayedVenteOperations);
    } catch (error) {
      console.error("Error fetching sales operations:", error);
      Swal.fire("Error!", "Failed to fetch sales operations.", "error");
    }
  }

  function renderSalesReports(venteOperationsToRender) {
    let table = "";

    for (let i = 0; i < venteOperationsToRender.length; i++) {
      const formattedDate = formatDateForDisplay(venteOperationsToRender[i].date);
      const numberOfArticles = venteOperationsToRender[i].articles.length;

      table += `
          <tr>
            <td>${i + 1}</td>
            <td>${venteOperationsToRender[i].name}</td>
            <td>${formattedDate}</td>
            <td>${numberOfArticles}</td>
            <td>
              <button class="btn btn-outline-success edit-vente-btn" data-vente-id="${venteOperationsToRender[i]._id}" data-index="${i}">
                  <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="btn btn-outline-dark view-vente-btn" data-vente-id="${venteOperationsToRender[i]._id}">
                  <span class="material-symbols-outlined">visibility</span>
              </button>
              <button class="btn btn-outline-danger delete-vente-btn" data-vente-id="${venteOperationsToRender[i]._id
        }">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
        `;
    }

    salesTableBody.innerHTML = table;
    attachSalesEventListeners();
  }

  async function deleteSalesReport(venteId) {
    try {
      const response = await fetch(
        `http://localhost:3000/sell-operations/${venteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      fetchSalesReports();
      refreshAllSections();
    } catch (error) {
      console.error("Error deleting sales operation:", error);
      Swal.fire("Error!", "Failed to delete sales operation.", "error");
    }
  }

  async function editSalesReport(venteId) {
    try {
      const response = await fetch(`http://localhost:3000/sell-operations/${venteId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const venteOperation = await response.json();

      // Populate the "Add" modal's fields
      salesNameInput.value = venteOperation.name;
      salesDateInput.value = venteOperation.date ? venteOperation.date.split('T')[0] : '';

      // Clear existing products in the list
      salesProductListContainer.innerHTML = '';
      salesProductArray = []

      // Populate product list with articles from the venteOperation
      if (venteOperation.articles && venteOperation.articles.length > 0) {
        venteOperation.articles.forEach(article => {
          const productId = article.product; // Directly use the product ID from the article

          const product = productList.find(p => p._id === productId); // Find product in your product list

          if (product) {
            addProductToSalesListForEdit(product, article.quantity);  // use the adapted function
            updateSalesProductArray(product._id, article.quantity);
          } else {
            console.warn(`Product with ID ${productId} not found`);
          }
        });
      }

      // Save VenteID
      document.getElementById('saveVente').dataset.venteId = venteId;
      newProductModal.show();

      //Set update to true
      isAnUpdate = true;

    } catch (error) {
      console.error("Error fetching sales operation for editing:", error);
      Swal.fire("Error!", "Failed to fetch sales operation for editing.", "error");
    }
  }

  function viewSalesReport(venteId) {
    // Implement the logic to display the sales report details (read-only)
    // You can use a modal or another section of the page
    // For example:
    alert(`Viewing sales operation with ID: ${venteId}`); // Replace with your implementation
  }

  function attachSalesEventListeners() {
    document.querySelectorAll(".delete-vente-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const venteId = this.dataset.venteId;

        Swal.fire({
          title: "Are you sure?",
          text: "You won't be able to revert this!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
          if (result.isConfirmed) {
            await deleteSalesReport(venteId);
            Swal.fire("Deleted!", "Your sales operation has been deleted.", "success");
            refreshAllSections()
          }
        });
      });
    });

    document.querySelectorAll(".edit-vente-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const venteId = this.dataset.venteId;
        editSalesReport(venteId);
      });
    });

    document.querySelectorAll(".view-vente-btn").forEach((button) => {
      button.addEventListener("click", async function () {
        const venteId = this.dataset.venteId;
        const venteOperation = await fetchSellOperation(venteId); // Fetch vente operation data

        if (!venteOperation) {
          Swal.fire("Error!", "Vente operation not found.", "error");
          return;
        }

        console.log("Vente Operation:", venteOperation);

        // Build the message for the Swal popup
        let message = `<p><strong>Name:</strong> ${venteOperation.name || "Unknown"}</p>`;
        message += `<p><strong>Date:</strong> ${formatDateForDisplay(venteOperation.date)}</p>`;
        message += `<h5>Articles:</h5>`;

        if (venteOperation.articles && venteOperation.articles.length > 0) {
          message += '<ul>';

          venteOperation.articles.forEach((article) => {
            console.log("Article Product ID:", article.product, "or", article.product_id);

            // Fix: Ensure correct ID matching
            const product = productList.find((p) => {
              // Check if `article.product` is an object with `_id` or a direct ID
              const productId = article.product?._id || article.product || article.product_id;
              return String(p._id) === String(productId) || String(p.id) === String(productId);
            });

            if (product) {
              message += `<li>${product.title || "Unnamed Product"} - Quantity: ${article.quantity || 0}</li>`;
            } else {
              message += `<li>Product not found - Quantity: ${article.quantity || 0}</li>`;
            }
          });

          message += '</ul>';
        } else {
          message += `<p>No articles found.</p>`;
        }

        // Display the Swal popup
        Swal.fire({
          title: "Vente Operation Details",
          html: message,
          showCloseButton: true,
          didOpen: () => {
            const popup = Swal.getPopup();
            popup.classList.add('swal-wide');
          },
        });
      });
    });
  }

  function populateSelectProductDropdown() {
    inventorySelectProductDropdown.innerHTML =
      '<option value="" selected>Choose a product...</option>';
    productList.forEach((product) => {
      const option = document.createElement("option");
      option.value = product._id;
      option.textContent = product.title;
      inventorySelectProductDropdown.appendChild(option);
    });
  }

  function populateSalesSelectProductDropdown() {
    salesSelectProductDropdown.innerHTML =
      '<option value="" selected>Choose a product...</option>';
    productList.forEach((product) => {
      const option = document.createElement("option");
      option.value = product._id;
      option.textContent = product.title;
      salesSelectProductDropdown.appendChild(option);
    });
  }

  // ==========================================================================
  //  EVENT LISTENERS (Buttons, Navigation)
  // ==========================================================================

  const addProductToInventoryButton = document.querySelector(".add-product");
  addProductToInventoryButton.addEventListener("click", addProductToInventoryList);

  const saveInventoryButton = document.querySelector(".save-operation");
  saveInventoryButton.addEventListener("click", saveInventoryOperation);

  const addProductToSalesButton = document.querySelector(".add-vente-product");
  addProductToSalesButton.addEventListener("click", addProductToSalesList);

  const saveSalesButton = document.querySelector(".save-vente");
  saveSalesButton.addEventListener("click", saveSalesReport);
  function searchProductInSales(title) {
    const foundSales = salesProductArray.filter(product => product.title.includes(title));

    if (foundSales.length > 0) {
      console.log("Found sales:", foundSales);
    } else {
      console.log("No matching sales found.");
    }
  }
  searchVenteProduct

  // STOCK SEARCH FUNCTIONALITY
  function searchStockOperations(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    displayedInventoryOperations = inventoryOperations.filter(operation => {
      // Check if the operation name contains the search term
      if (operation.name.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Check if any of the products in the operation's articles contain the search term
      if (operation.articles.some(article => {
        const product = productList.find(p => p._id === article.product);
        return product && product.title.toLowerCase().includes(searchTerm);
      })) {
        return true;
      }

      return false;
    });
    renderInventoryOperations(displayedInventoryOperations);
  }

  // STOCK SEARCH INPUT EVENT LISTENER
  searchStockInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase().trim();
    searchStockOperations(searchTerm);
  });

  async function fetchSellOperation(venteId) {
    try {
      const response = await fetch(`http://localhost:3000/sell-operations/${venteId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching sell operation:", error);
      Swal.fire("Error!", "Failed to fetch sell operation.", "error");
      return null;
    }
  }
  // ------------------- New Function -----------------------
  async function refreshAllSections() {
    try {
      await Promise.all([
        fetchProducts(),
        fetchInventoryOperations(),
        fetchSalesReports()
        // Add calls to any other data-fetching functions you have
      ]);
      console.log("All sections refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing all sections:", error);
      Swal.fire("Error!", "Failed to refresh all sections.", "error");
    }
  }
  function addProductToSalesListForEdit(product, quantity) {
    const productItem = document.createElement("div");
    productItem.dataset.productId = product._id;
    productItem.dataset.quantity = quantity;
    productItem.classList.add(
      "product-item",
      "d-flex",
      "justify-content-between",
      "align-items-center",
      "bg-light",
      "p-2",
      "rounded",
      "mb-2"
    );

    productItem.innerHTML = `
            <span>${product.title}</span>
            <div>
              <span class="quantity me-2">${quantity}</span>
              <button type="button" class="btn btn-sm btn-outline-danger remove-product" aria-label="Supprimer produit">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          `;

    salesProductListContainer.appendChild(productItem);
  }

  // clear form for all operations
  function clearSalesFormAfterSave() {
    salesNameInput.value = "";
    salesDateInput.value = "";
    salesProductListContainer.innerHTML = ""; // Clear the product list as well
    salesProductArray = []; // Reset the product array too

    // reset a data
    document.getElementById('saveVente').dataset.venteId = "";
    isAnUpdate = false;

    generateSalesTable(salesProductArray);
  }

  // Vente Search Functionality
  function searchVenteOperations(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    displayedVenteOperations = venteOperations.filter(operation => {
      // Check if the operation name contains the search term
      if (operation.name.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Check if any of the products in the operation's articles contain the search term
      if (operation.articles.some(article => {
        const product = productList.find(p => p._id === article.product);
        return product && product.title.toLowerCase().includes(searchTerm);
      })) {
        return true;
      }

      return false;
    });
    renderSalesReports(displayedVenteOperations); // Use renderSalesReports to update the table
  }

  // Vente Search Input Event Listener
  searchVenteInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase().trim();
    searchVenteOperations(searchTerm);
  });

  // Initial data loading
  fetchProducts();
  fetchInventoryOperations();
  fetchSalesReports();
  // New event lister for edit

  document.getElementById('saveVente').addEventListener('click', async function () {
    if (!isAnUpdate) {
      //Code for new event
      //Get newValues and store
      console.log("Adding")

    }
    else {

      const updatedName = salesNameInput.value;
      const updatedDate = salesDateInput.value;

      const updatedArticles = salesProductArray.map(item => ({
        product: item.product,
        quantity: item.quantity
      }));

      if (!updatedName || !updatedDate) {
        Swal.fire("Warning!", "Please fill all fields.", "warning");
        return;
      }

      // get Vente Id
      const venteId = this.dataset.venteId;

      const updatedVenteData = {
        name: updatedName,
        date: updatedDate,
        articles: updatedArticles
      };

      try {
        const response = await fetch(`http://localhost:3000/sell-operations/${venteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedVenteData)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        Swal.fire("Updated!", "Sales operation updated successfully.", "success");

        fetchSalesReports();  // Refresh

        // Close modal
        const newProductModal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        newProductModal.hide();
        refreshAllSections();
        clearSalesFormAfterSave();

      } catch (error) {
        console.error("Error updating sales operation:", error);
        Swal.fire("Error!", "Failed to update sales operation.", "error");
      }
    }
  });
});

// Adding a custom CSS class so the popup
// content adapts to the container size
const fireSwal = () => {
  Swal.fire({
    didOpen: () => {
      const popup = Swal.getPopup()
      popup.classList.add('swal-wide')
    }
  })
}