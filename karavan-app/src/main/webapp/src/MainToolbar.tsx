import React from "react";
import {
  PageSectionVariants,
  Flex,
  PageSection,
  FlexItem,
} from "@patternfly/react-core";
import "./designer/karavan.css";

interface Props {
  title: any;
  tools: any;
}

interface State {
  title: any;
  tools: React.Component;
}

export class MainToolbar extends React.PureComponent<Props, State> {
  render() {
    return (
      <PageSection
        className="tools-section"
        variant={PageSectionVariants.light}
      >
        <Flex
          className="tools"
          justifyContent={{ default: "justifyContentSpaceBetween" }}
        >
          <FlexItem>{this.props.title}</FlexItem>
          <FlexItem>{this.props.tools}</FlexItem>
        </Flex>
      </PageSection>
    );
  }
}
