import ChecklistPage
  from "../components/ChecklistPage";

import { enxovalConfig }
  from "../data/checklistConfigs";


export default function Home() {
  return (
    <ChecklistPage
      config={enxovalConfig}
    />
  );
}
