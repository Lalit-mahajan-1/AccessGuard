import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { PlannerAgent } from "../agents/plannerAgent.js";
import { FixAgent } from "../agents/fixAgent.js";
import type { FixTask } from "../agents/fixAgent.js";
import { PrAgent } from "../agents/prAgent.js";
import { DockerSandbox } from "../tools/dockerSandbox.js";

// Define the AgentState using Annotation.Root
export const AgentStateAnnotation = Annotation.Root({
  projectId: Annotation<string>(),
  auditId: Annotation<string>(),
  githubRepo: Annotation<string>(),
  verificationCommand: Annotation<string>(),
  tasks: Annotation<FixTask[]>(),
  currentTaskIndex: Annotation<number>(),
  containerName: Annotation<string | null>(),
  successfulFixes: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  failedFixes: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  prUrl: Annotation<string | null>(),
});

type StateType = typeof AgentStateAnnotation.State;

// Node implementations
const plannerNode = async (state: StateType) => {
  console.log(`[Workflow][Planner] Running planner for project ${state.projectId}...`);
  const plan = await PlannerAgent.plan(state.projectId, state.auditId);
  console.log(`[Workflow][Planner] Generated plan with ${plan.length} tasks.`);
  return {
    tasks: plan,
    currentTaskIndex: 0,
  };
};

const fixNode = async (state: StateType) => {
  let containerName = state.containerName;
  
  // Initialize Sandbox container if it doesn't exist
  if (!containerName) {
    console.log(`[Workflow][Fix] Initializing Docker Sandbox container...`);
    containerName = await DockerSandbox.createSandbox(state.githubRepo, state.projectId);
    console.log(`[Workflow][Fix] Container started: ${containerName}`);
  }

  const currentTask = state.tasks[state.currentTaskIndex];
  if (!currentTask) {
    throw new Error(`No task found at index ${state.currentTaskIndex}`);
  }
  console.log(`[Workflow][Fix] Executing task index ${state.currentTaskIndex}/${state.tasks.length - 1} on file: ${currentTask.file}`);
  
  const result = await FixAgent.executeFix(containerName, currentTask, state.verificationCommand);

  if (result.success) {
    console.log(`[Workflow][Fix] Task index ${state.currentTaskIndex} succeeded!`);
    return {
      containerName,
      successfulFixes: [
        {
          file: currentTask.file,
          task: currentTask.task,
          issue: currentTask.issue,
        },
      ],
      currentTaskIndex: state.currentTaskIndex + 1,
    };
  } else {
    console.warn(`[Workflow][Fix] Task index ${state.currentTaskIndex} failed: ${result.errorLogs}`);
    return {
      containerName,
      failedFixes: [
        {
          file: currentTask.file,
          task: currentTask.task,
          issue: currentTask.issue,
          error: result.errorLogs || "Verification failed",
        },
      ],
      currentTaskIndex: state.currentTaskIndex + 1,
    };
  }
};

const collectorNode = async (state: StateType) => {
  console.log(`[Workflow][Collector] All tasks processed. Merging fixes...`);
  console.log(`- Succeeded: ${state.successfulFixes.length}`);
  console.log(`- Failed: ${state.failedFixes.length}`);
  return {};
};

const prNode = async (state: StateType) => {
  console.log(`[Workflow][PR] Open PR for ${state.successfulFixes.length} successful fixes...`);
  if (!state.containerName) {
    throw new Error("No sandbox container is active to create PR from");
  }

  try {
    const prUrl = await PrAgent.createPrForFixes(
      state.githubRepo,
      state.containerName,
      state.successfulFixes,
      state.projectId
    );

    console.log(`[Workflow][PR] Cleaning up container ${state.containerName}...`);
    await DockerSandbox.cleanupSandbox(state.containerName);

    return {
      prUrl,
      containerName: null,
    };
  } catch (err: any) {
    console.error(`[Workflow][PR] Failed to submit PR: ${err.message}`);
    await DockerSandbox.cleanupSandbox(state.containerName);
    return {
      containerName: null,
    };
  }
};

const flagTasksNode = async (state: StateType) => {
  console.warn(`[Workflow][Flag] All fixes failed, flagging for human assistance.`);
  if (state.containerName) {
    console.log(`[Workflow][Flag] Cleaning up container ${state.containerName}...`);
    await DockerSandbox.cleanupSandbox(state.containerName);
  }
  return {
    containerName: null,
  };
};

// Route decisions (conditional edges)
const routeTaskExecution = (state: StateType) => {
  if (state.currentTaskIndex < state.tasks.length) {
    console.log(`[Workflow][Router] Continuing task loop (next index: ${state.currentTaskIndex})`);
    return "fixNode";
  }
  console.log(`[Workflow][Router] Completed all tasks, routing to collector`);
  return "collectorNode";
};

const routeCollectorDecision = (state: StateType) => {
  if (state.successfulFixes.length > 0) {
    console.log(`[Workflow][Router] Succeeded fixes exist, routing to PR Node`);
    return "prNode";
  }
  console.log(`[Workflow][Router] No fixes succeeded, routing to Flag Node`);
  return "flagTasksNode";
};

// Graph construction
const graph = new StateGraph(AgentStateAnnotation)
  .addNode("plannerNode", plannerNode)
  .addNode("fixNode", fixNode)
  .addNode("collectorNode", collectorNode)
  .addNode("prNode", prNode)
  .addNode("flagTasksNode", flagTasksNode)
  
  .addEdge("__start__", "plannerNode")
  
  // After planner, route dynamically to task loop or exit
  .addConditionalEdges("plannerNode", routeTaskExecution, {
    fixNode: "fixNode",
    collectorNode: "collectorNode",
  })
  
  // In the task execution loop, route back to fixNode or move on to collector
  .addConditionalEdges("fixNode", routeTaskExecution, {
    fixNode: "fixNode",
    collectorNode: "collectorNode",
  })

  // From collector, route based on outcome
  .addConditionalEdges("collectorNode", routeCollectorDecision, {
    prNode: "prNode",
    flagTasksNode: "flagTasksNode",
  })
  
  .addEdge("prNode", END)
  .addEdge("flagTasksNode", END);

// Compile the LangGraph graph
export const fixWorkflow = graph.compile();
