console.log("Email Writer Extension - Content Script Loaded");

// --- Create AI Reply button ---
function createAIButton() {
  const button = document.createElement("div");
  button.className = "T-J-J-J5-Ji ao0 v7 T-I-atl L3";
  button.style.marginRight = "8px";
  button.innerText = "AI Reply";
  button.setAttribute("role", "button");
  button.setAttribute("data-tooltip", "Generate AI Reply");
  return button;
}

// --- Extract email content ---
function getEmailContent() {
  const selectors = [
    ".a3s.aiL", 
    ".h7",
    ".gmail_quote",
    '[role="presentation"]'
  ];

  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content) {
      return content.innerText.trim();
    }
  }

  return "";
}

// --- Find Gmail compose toolbar ---
function findComposeToolbar() {
  const selectors = [
    ".aDh",
    ".btC",
    '[role="toolbar"]',
    ".gU.Up"
  ];

  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) return toolbar;
  }

  return null;
}

// --- Inject AI Reply button ---
function injectButton() {
  const existingButton = document.querySelector(".ai-reply-button");
  if (existingButton) existingButton.remove();

  const toolbar = findComposeToolbar();
  if (!toolbar) {
    console.log("Toolbar not found");
    return;
  }

  console.log("Toolbar found. Injecting AI Reply button.");
  const button = createAIButton();
  button.classList.add("ai-reply-button");

  // --- CLICK HANDLER ---
  button.addEventListener("click", async () => {
    try {
      button.innerHTML = "Generating...";
      button.disabled = true;

      const emailContent = getEmailContent();
      console.log("Captured Email Content:", emailContent);

      const tone = prompt(
  "Choose tone: professional / casual / informal",
  "professional"
);

      const response = await fetch(
        "https://email-backend-8k95.onrender.com/api/email/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailContent: emailContent,
            tone: tone,
          }),
        }
      );

      if (!response.ok) throw new Error("API Request Failed");

      const generatedReply = await response.text();
      const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

      if (composeBox) {
        composeBox.focus();
        document.execCommand("insertText", false, generatedReply);
      } else {
        console.error("Compose box not found");
      }
    } catch (error) {
      console.error("Error generating AI reply:", error);
      alert("Failed to generate AI reply. Please try again.");
    } finally {
      button.innerHTML = "AI Reply";
      button.disabled = false;
    }
  });

  toolbar.insertBefore(button, toolbar.firstChild);
}

// --- Observe Gmail for new compose windows ---
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);

    const hasComposeElement = addedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches(".aDh, .btC, [role='dialog']") ||
          node.querySelector?.(".aDh, .btC, [role='dialog']"))
    );

    if (hasComposeElement) {
      console.log("Compose Window Detected");
      setTimeout(injectButton, 500);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
