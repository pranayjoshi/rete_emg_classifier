import { Presets } from "rete-react-plugin";
import styled from "styled-components";
import { $fontfamily } from "./consts";

export const Menu = styled(Presets.contextMenu.Menu)``;
export const Item = styled(Presets.contextMenu.Item)`
  background: #191c46dd;
  border-color: #6759bc;
  font-family: ${$fontfamily};
  :hover {
    background: #191c46;
  }
`;

export const Common = styled(Presets.contextMenu.Common)`
  background: #191c46dd;
  border-color: #6759bc;
  font-family: ${$fontfamily};
  :hover {
    background: #191c46;
  }
`;
export const Search = styled(Presets.contextMenu.Search)`
  border-color: #6759bc;
`;
export const Subitems = Presets.contextMenu.Subitems;
