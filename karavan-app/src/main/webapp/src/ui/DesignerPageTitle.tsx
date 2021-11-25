import {
  Text,
  TextContent,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import React from "react";

interface Props {
  view: "design" | "code";
  onChangeView: (inputView: "design" | "code") => void;
}

export function DesignerPageTitle({ view, onChangeView }: Props) {
  return (
    <div className="dsl-title">
      <TextContent className="title">
        <Text component="h1">Designer</Text>
      </TextContent>
      <ToggleGroup aria-label="Switch view" className="toggle">
        <ToggleGroupItem
          text="Design"
          buttonId="design"
          isSelected={view === "design"}
          onChange={() => onChangeView("design")}
        />
        <ToggleGroupItem
          text="YAML"
          buttonId="yaml"
          isSelected={view === "code"}
          onChange={() => onChangeView("code")}
        />
      </ToggleGroup>
    </div>
  );
}
