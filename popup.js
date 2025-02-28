document.addEventListener("DOMContentLoaded", async () => {
    // ---------- DOM Elements ----------
    const UI = {
      templateSelect: document.getElementById("templateSelect"),
      applyButton: document.getElementById("applyTemplate"),
      loadingText: document.getElementById("loadingText"),
      statusMessage: document.createElement("div")
    };
  
    // ---------- State Management ----------
    const state = {
      templates: [],
      isFetching: false,
      error: null
    };
  
    // ---------- UI Utilities ----------
    const updateUIState = () => {
      UI.templateSelect.disabled = state.isFetching || !!state.error;
      UI.applyButton.disabled = state.isFetching || !!state.error || !UI.templateSelect.value;
      UI.loadingText.style.display = state.isFetching ? "block" : "none";
      
      if(state.error) {
        UI.statusMessage.textContent = state.error;
        UI.statusMessage.classList.add("error-message");
        document.body.appendChild(UI.statusMessage);
      }
    };
  
    // ---------- Core Functions ----------
    const fetchTemplates = async () => {
      state.isFetching = true;
      state.error = null;
      updateUIState();
  
      try {
        const response = await fetch(chrome.runtime.getURL("templates.json"), {
          cache: "reload"
        });
        
        if(!response.ok) throw new Error("خطا در دریافت قالب‌ها");
        
        const data = await response.json();
        state.templates = data.templates;
        
        // Populate dropdown
        UI.templateSelect.innerHTML = `
          <option value="" disabled selected>قالب را انتخاب کنید</option>
          ${state.templates.map(t => `
            <option value="${t.content}" data-no-translate>${t.name}</option>
          `).join("")}
        `;
  
      } catch (error) {
        state.error = `خطا: ${error.message || "عدم دسترسی به قالب‌ها"}`;
        console.error("خطای سیستمی:", error);
      } finally {
        state.isFetching = false;
        updateUIState();
      }
    };
  
    // ---------- Event Handlers ----------
    const handleApplyTemplate = async () => {
      try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        await chrome.scripting.executeScript({
          target: {tabId: tab.id},
          func: (template) => {
            const editor = document.querySelector(`
              [contenteditable="true"],
              [role="textbox"],
              [aria-label="Message body"]
            `);
            
            if(!editor) throw new Error("ویرایشگر پیام یافت نشد");
            
            const wrapper = document.createElement("span");
            wrapper.setAttribute("data-no-translate", "true");
            wrapper.innerHTML = template.replace(/\n/g, "<br>");
            
            editor.focus();
            document.execCommand("insertHTML", false, wrapper.outerHTML);
          },
          args: [UI.templateSelect.value]
        });
  
        // Close popup after successful insertion
        window.close();
  
      } catch (error) {
        state.error = `خطا: ${error.message}`;
        updateUIState();
      }
    };
  
    // ---------- Event Listeners ----------
    UI.templateSelect.addEventListener("change", updateUIState);
    UI.applyButton.addEventListener("click", handleApplyTemplate);
  
    // ---------- Initialization ----------
    UI.statusMessage.className = "status-message";
    document.body.appendChild(UI.statusMessage);
    
    await fetchTemplates();
  });