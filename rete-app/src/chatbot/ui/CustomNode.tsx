import { Presets, ClassicScheme, RenderEmit } from "rete-react-plugin";
import { css } from "styled-components";
import { $fontfamily } from "./consts";

const styles = css<{ selected?: boolean }>`
  background: #191c46dd;
  border: 5px #cfc7ff solid;
  border-radius: 25px;
  transition: background 0.4s;
  .title {
    color: white;
    text-align: center;
    border-radius: 20px 20px 0 0;
    border-bottom: 5px #cfc7ff solid;
    font-family: ${$fontfamily};
    font-weight: 100;
    font-size: 1.2em;
  }
  &:hover {
    background: #191c46;
  }
  .input-title,
  .output-title {
    font-weight: 100;
    font-family: ${$fontfamily};
  }
  .output-socket {
    margin-right: -1px;
  }
  .input-socket {
    margin-left: -1px;
  }
  ${(props) =>
    props.selected &&
    css`
      border-color: #ff0000c4;
      .title {
        border-color: #ff0000c4;
      }
    `}
`;

type Props<S extends ClassicScheme> = {
  data: S["Node"];
  styles?: () => any;
  emit: RenderEmit<S>;
};

export function CustomNodeComponent<S extends ClassicScheme>(props: Props<S>) {
  return <Presets.classic.Node styles={() => styles} {...props} />;
}
