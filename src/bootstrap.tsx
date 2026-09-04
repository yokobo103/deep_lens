import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { FossilPrototype } from "./fossil/FossilPrototype";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FossilPrototype />
  </StrictMode>,
);
