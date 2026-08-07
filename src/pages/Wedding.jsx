import ChecklistPage
  from "../components/ChecklistPage";

import { casamentoConfig }
  from "../data/checklistConfigs";


export default function Wedding() {
  return (
    <ChecklistPage
      config={casamentoConfig}
    />
  );
}
