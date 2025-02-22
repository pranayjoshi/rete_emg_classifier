import * as React from "react";
import { ClassicPreset } from "rete";
import styled from "styled-components";
import { $socketsize } from "./consts";

const Styles = styled.div`
  display: inline-block;
  cursor: pointer;
  border: 3px solid #b30000b8;
  border-radius: 1em;
  width: ${$socketsize}px;
  height: ${$socketsize}px;
  vertical-align: middle;
  background: #ff666699;
  margin: 0.1em 0.7em;
  z-index: 2;
  box-sizing: border-box;
  &:hover {
    border-width: 4px;
  }
  &.multiple {
    border-color: yellow;
  }
`;

export function TextSocketComponent<T extends ClassicPreset.Socket>(props: {
  data: T;
}) {
  return <Styles title={props.data.name} />;
}
