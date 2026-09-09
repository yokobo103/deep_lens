import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { GateHub } from "./gates/GateHub";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);
const highlightLabGate = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get("scene-highlight-lab")
  : null;

if (highlightLabGate) {
  void import("./dev/SceneHighlightLab").then(({ SceneHighlightLab }) => {
    root.render(
      <StrictMode>
        <SceneHighlightLab gateId={highlightLabGate} />
      </StrictMode>,
    );
  });
} else {
  root.render(
    <StrictMode>
      <GateHub />
    </StrictMode>,
  );
}
