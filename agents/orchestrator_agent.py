"""
Orchestrator Agent Implementation

This agent coordinates multiple specialized agents to complete complex tasks.
"""

import logging
from typing import Any, Dict, List, Optional, Type

from agents.base_agent import BaseAgent, AgentConfig, AgentResponse, AgentStatus

logger = logging.getLogger(__name__)


class OrchestratorAgent(BaseAgent):
    """
    Agent that orchestrates multiple specialized agents.

    Capabilities:
    - Task decomposition
    - Agent routing
    - Workflow coordination
    - Result synthesis
    """

    def __init__(self, config: Optional[AgentConfig] = None):
        """
        Initialize the orchestrator agent.

        Args:
            config: Optional custom configuration. If not provided, uses defaults.
        """
        if config is None:
            config = AgentConfig(
                name="OrchestratorAgent",
                model_name="gemini-2.5-flash-preview-5-20",
                temperature=0.5,
                system_prompt="""You are an orchestrator agent. Your role is to:
                - Coordinate multiple specialized agents
                - Break down complex tasks into subtasks
                - Route tasks to appropriate agents
                - Synthesize results from multiple agents
                - Ensure workflow efficiency

                Think strategically about task decomposition and agent coordination."""
            )

        super().__init__(config)
        self.registered_agents: Dict[str, BaseAgent] = {}

    def register_agent(self, agent: BaseAgent) -> None:
        """
        Register a specialized agent.

        Args:
            agent: The agent to register
        """
        self.registered_agents[agent.config.name] = agent
        logger.info(f"Registered agent: {agent.config.name}")

    def process_task(self, task: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Process a task by orchestrating multiple agents.

        Args:
            task: The task to orchestrate
            context: Optional context information

        Returns:
            AgentResponse with synthesized results
        """
        logger.info(f"Orchestrator processing task: {task[:100]}...")

        # Plan the workflow
        workflow_plan = self._plan_workflow(task, context)

        # Execute the workflow
        results = self._execute_workflow(workflow_plan)

        # Synthesize results
        final_response = self._synthesize_results(results, task)

        return final_response

    def _plan_workflow(self, task: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Plan the workflow for executing the task.

        Args:
            task: The task description
            context: Optional context

        Returns:
            Workflow plan
        """
        # Simple planning logic - can be enhanced with LLM-based planning
        plan = {
            "task": task,
            "context": context or {},
            "steps": [],
            "agents_needed": []
        }

        # This is a simplified planning - in production, you'd use the LLM to plan
        # For now, we'll just acknowledge the registered agents
        plan["agents_needed"] = list(self.registered_agents.keys())

        logger.info(f"Workflow planned with {len(plan['agents_needed'])} agents")
        return plan

    def _execute_workflow(self, plan: Dict[str, Any]) -> List[AgentResponse]:
        """
        Execute the planned workflow.

        Args:
            plan: The workflow plan

        Returns:
            List of responses from agents
        """
        results = []

        # Sequential execution for now - can be enhanced with parallel execution
        for agent_name in plan["agents_needed"]:
            if agent_name in self.registered_agents:
                agent = self.registered_agents[agent_name]
                response = agent.run(plan["task"], plan["context"])
                results.append(response)

        return results

    def _synthesize_results(self, results: List[AgentResponse], original_task: str) -> AgentResponse:
        """
        Synthesize results from multiple agents.

        Args:
            results: List of agent responses
            original_task: The original task

        Returns:
            Synthesized response
        """
        if not results:
            return AgentResponse(
                agent_name=self.config.name,
                content="No results to synthesize",
                status=AgentStatus.COMPLETED
            )

        # Combine all responses
        synthesis_prompt = f"Original Task: {original_task}\n\n"
        synthesis_prompt += "Results from specialized agents:\n\n"

        for i, result in enumerate(results, 1):
            synthesis_prompt += f"Agent {i} ({result.agent_name}):\n"
            synthesis_prompt += f"{result.content}\n\n"

        synthesis_prompt += """
Please synthesize these results into a comprehensive, coherent response that:
1. Combines insights from all agents
2. Resolves any contradictions
3. Provides a complete answer to the original task
4. Highlights key findings and recommendations
"""

        # Use LLM to synthesize
        synthesized = self.generate_with_tools(synthesis_prompt)

        # Add metadata about which agents contributed
        synthesized.metadata["contributing_agents"] = [r.agent_name for r in results]
        synthesized.metadata["num_agents"] = len(results)

        return synthesized

    def execute_sequential_workflow(self, tasks: List[Dict[str, Any]]) -> List[AgentResponse]:
        """
        Execute a sequential workflow where each task is assigned to a specific agent.

        Args:
            tasks: List of task dictionaries with 'agent_name' and 'task' keys

        Returns:
            List of responses in order
        """
        results = []

        for i, task_info in enumerate(tasks):
            agent_name = task_info.get("agent_name")
            task = task_info.get("task")
            context = task_info.get("context", {})

            if agent_name not in self.registered_agents:
                logger.error(f"Agent not found: {agent_name}")
                continue

            # Add previous results to context
            if i > 0:
                context["previous_results"] = [r.content for r in results]

            agent = self.registered_agents[agent_name]
            response = agent.run(task, context)
            results.append(response)

            logger.info(f"Completed step {i+1}/{len(tasks)}")

        return results

    def execute_parallel_workflow(self, tasks: List[Dict[str, Any]]) -> List[AgentResponse]:
        """
        Execute tasks in parallel (simulated for now - can be made truly parallel with async).

        Args:
            tasks: List of task dictionaries with 'agent_name' and 'task' keys

        Returns:
            List of responses
        """
        # For now, this is sequential - can be enhanced with asyncio
        results = []

        for task_info in tasks:
            agent_name = task_info.get("agent_name")
            task = task_info.get("task")
            context = task_info.get("context", {})

            if agent_name not in self.registered_agents:
                logger.error(f"Agent not found: {agent_name}")
                continue

            agent = self.registered_agents[agent_name]
            response = agent.run(task, context)
            results.append(response)

        return results
