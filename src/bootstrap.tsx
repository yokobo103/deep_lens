import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { GateHub } from "./gates/GateHub";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GateHub />
  </StrictMode>,
);
