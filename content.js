function addCustomStyles() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("styles.css");
  document.head.appendChild(link);
}

let templates = [];

async function initialize() {
  try {
    const response = await fetch(chrome.runtime.getURL("templates.json"));
    const data = await response.json();
    templates = data.templates.map(t => t.content);
    console.log("قالب‌ها لود شدند:", templates);
    
    addCustomStyles();
    translatePage();
  } catch (error) {
    console.error("خطا در لود قالب‌ها:", error);
  }
}

initialize();

function translateText(node) {
  if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('data-no-translate')) {
    console.log("متن قالب شناسایی شد، ترجمه نمی‌شود:", node.textContent);
    return;
  }

  if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
    const text = node.textContent.replace(/<br>/gi, "\n").trim();
    const cleanText = text.replace(/\s+/g, " ").trim();
    const cleanTemplates = templates.map(t => t.replace(/\s+/g, " ").trim());
    if (cleanTemplates.includes(cleanText)) {
      console.log("متن قالب شناسایی شد، ترجمه نمی‌شود:", cleanText);
      return;
    }
    const originalText = node.textContent;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fa&dt=t&q=${encodeURIComponent(originalText)}`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        node.textContent = data[0][0][0];
        console.log("ترجمه شد:", originalText, "به", data[0][0][0]);
      })
      .catch(error => console.error("خطا در ترجمه:", error));
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    for (const childNode of node.childNodes) {
      translateText(childNode);
    }
  }
}

function translatePage() {
  console.log("شروع ترجمه صفحه");
  translateText(document.body);
}

const observer = new MutationObserver((mutations) => {
  console.log("تغییرات DOM شناسایی شد");
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach(translateText);
  });
});

observer.observe(document.body, { childList: true, subtree: true });