import { createBrowserRouter } from "react-router";
import { VisualizationLayout } from "./components/VisualizationLayout";
import { AttackPathDiagram } from "./components/diagrams/AttackPathDiagram";
import { BayesianPropagationMap } from "./components/diagrams/BayesianPropagationMap";
import { GraphTopologySystem } from "./components/diagrams/GraphTopologySystem";
import { DistributedArchitectureMap } from "./components/diagrams/DistributedArchitectureMap";
import { GraphPartitioningVisual } from "./components/diagrams/GraphPartitioningVisual";
import { TemporalMutationDiagram } from "./components/diagrams/TemporalMutationDiagram";
import { AttackEconomicsSystem } from "./components/diagrams/AttackEconomicsSystem";
import { TopologyResistanceMap } from "./components/diagrams/TopologyResistanceMap";
import { EventDrivenPropagation } from "./components/diagrams/EventDrivenPropagation";
import { OperationalCognitionWorkflow } from "./components/diagrams/OperationalCognitionWorkflow";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: VisualizationLayout,
    children: [
      { index: true, Component: AttackPathDiagram },
      { path: "attack-path", Component: AttackPathDiagram },
      { path: "bayesian-propagation", Component: BayesianPropagationMap },
      { path: "graph-topology", Component: GraphTopologySystem },
      { path: "distributed-architecture", Component: DistributedArchitectureMap },
      { path: "graph-partitioning", Component: GraphPartitioningVisual },
      { path: "temporal-mutation", Component: TemporalMutationDiagram },
      { path: "attack-economics", Component: AttackEconomicsSystem },
      { path: "topology-resistance", Component: TopologyResistanceMap },
      { path: "event-propagation", Component: EventDrivenPropagation },
      { path: "operational-cognition", Component: OperationalCognitionWorkflow },
    ],
  },
]);
