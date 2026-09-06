import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
document.documentElement.lang = "es";
document.documentElement.classList.add("notranslate");
document.documentElement.setAttribute("translate", "no");
document.body.classList.add("notranslate");
document.body.setAttribute("translate", "no");

const googleNotranslateMeta = document.createElement("meta");
googleNotranslateMeta.name = "google";
googleNotranslateMeta.content = "notranslate";
document.head.appendChild(googleNotranslateMeta);

createRoot(document.getElementById("root")!).render(<App />);
