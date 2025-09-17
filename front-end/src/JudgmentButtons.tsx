import PropTypes from "prop-types";
import { Button, ButtonGroup, Dropdown, DropdownButton } from "react-bootstrap";

type JudgmentDesc = {
  label: string;
  color: string;
};

type DropdownDesc = {
  [key: string]: JudgmentDesc;
};

type JudgmentLevels = {
  [key: string]: DropdownDesc | JudgmentDesc;
};

type SimpleButtonProps = {
  judgment: string;
  desc: JudgmentDesc;
  judge: (string) => void;
};

function SimpleJudgmentButton({ judgment, desc, judge }: SimpleButtonProps) {
  const { label, color } = desc;
  return (
    <Button variant={color} onClick={() => judge(judgment)}>
      {label}
    </Button>
  );
}

type DropdownButtonProps = {
  label: string;
  desc: DropdownDesc;
  judge: (string) => void;
};

function DropdownJudgmentButton({ label, desc, judge }: DropdownButtonProps) {
  const items = [];
  for (const [key, jdesc] of Object.entries(desc)) {
    items.push(
      <Dropdown.Item onClick={() => judge(key)}>{jdesc.label}</Dropdown.Item>
    );
  }
  return <DropdownButton title={label}>{items}</DropdownButton>;
}

type JudgmentButtonsProps = {
  levels: JudgmentLevels;
  judge: () => void;
};

export default function JudgmentButtons({
  levels,
  judge,
}: JudgmentButtonsProps) {
  const items = [];
  for (const [key, ldesc] of Object.entries(levels)) {
    if ("label" in ldesc) {
      const desc: JudgmentDesc = {
        label: ldesc.label as string,
        color: ldesc.color as string,
      };
      items.push(
        <SimpleJudgmentButton judgment={key} desc={desc} judge={judge} />
      );
    } else {
      items.push(
        <DropdownJudgmentButton label={key} desc={ldesc} judge={judge} />
      );
    }
  }

  return <ButtonGroup>{items}</ButtonGroup>;
}
