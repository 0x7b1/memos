import { useColorScheme } from "@mui/joy";
import React from "react";
import { StrudelRepl } from "./StrudelRepl";

interface Props {
  content: string;
  onSave: (code: string) => void;
}

const StrudelBlock: React.FC<Props> = ({ content, onSave }: Props) => {
  const { mode: colorMode } = useColorScheme();

  const theme = colorMode == "dark" ? "githubDark" : "githubLight";

  return <StrudelRepl theme={theme} tune={content} hideHeader={false} onTrigger={() => {}} onSave={onSave} />;
};

export default StrudelBlock;
