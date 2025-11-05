#!/usr/bin/env python3
"""
Multi-Agent Demo

This example demonstrates multi-agent collaboration using:
- ResearcherAgent: Gathers information
- AnalyzerAgent: Analyzes the findings
- OrchestratorAgent: Coordinates the workflow

The demo shows how different specialized agents can work together
to solve complex tasks.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.researcher_agent import ResearcherAgent
from agents.analyzer_agent import AnalyzerAgent
from agents.orchestrator_agent import OrchestratorAgent
from tools.web_search import create_web_search_tool
from tools.code_executor import create_code_executor_tool


def main():
    """Run the multi-agent demo"""
    print("=" * 80)
    print("Multi-Agent Collaboration Demo")
    print("=" * 80)
    print()

    # Check for PROJECT_ID
    project_id = os.getenv("PROJECT_ID")
    if not project_id:
        print("⚠️  Warning: PROJECT_ID not set.")
        print("   This demo will show the agent architecture but cannot execute tasks.")
        print("   To run actual tasks, set PROJECT_ID environment variable.")
        print("   Example: export PROJECT_ID=your-gcp-project-id")
        print()

    # Create specialized agents
    print("Creating specialized agents...")
    print()

    researcher = ResearcherAgent()
    print(f"✓ Created: {researcher.config.name}")
    print(f"  Role: Information gathering and research")
    print(f"  Temperature: {researcher.config.temperature}")

    analyzer = AnalyzerAgent()
    print(f"✓ Created: {analyzer.config.name}")
    print(f"  Role: Data analysis and insights")
    print(f"  Temperature: {analyzer.config.temperature}")

    orchestrator = OrchestratorAgent()
    print(f"✓ Created: {orchestrator.config.name}")
    print(f"  Role: Multi-agent coordination")
    print(f"  Temperature: {orchestrator.config.temperature}")
    print()

    # Register agents with orchestrator
    print("Registering agents with orchestrator...")
    orchestrator.register_agent(researcher)
    orchestrator.register_agent(analyzer)
    print(f"✓ Registered {len(orchestrator.registered_agents)} agents")
    print()

    # Register tools
    print("Registering tools...")

    # Web search for researcher
    tool_name, tool_desc, tool_func, tool_params = create_web_search_tool()
    researcher.add_tool(tool_name, tool_desc, tool_func, tool_params)
    print(f"✓ {researcher.config.name}: {tool_name}")

    # Code executor for analyzer
    tool_name, tool_desc, tool_func, tool_params = create_code_executor_tool()
    analyzer.add_tool(tool_name, tool_desc, tool_func, tool_params)
    print(f"✓ {analyzer.config.name}: {tool_name}")
    print()

    # Demonstrate different collaboration patterns
    print("=" * 80)
    print("Demonstration 1: Sequential Workflow")
    print("=" * 80)
    print()

    if orchestrator.vertex_initialized:
        tasks = [
            {
                "agent_name": "ResearcherAgent",
                "task": "Research the current capabilities of Google's Gemini 2.5 Flash model",
                "context": {}
            },
            {
                "agent_name": "AnalyzerAgent",
                "task": "Analyze the research findings and identify key capabilities and use cases",
                "context": {}
            }
        ]

        print("Task: Understand Gemini 2.5 Flash capabilities")
        print()
        print("Workflow:")
        for i, task in enumerate(tasks, 1):
            print(f"  Step {i}: {task['agent_name']} - {task['task'][:60]}...")

        print()
        print("Executing sequential workflow...")
        results = orchestrator.execute_sequential_workflow(tasks)

        for i, result in enumerate(results, 1):
            print()
            print(f"Step {i} Result ({result.agent_name}):")
            print("-" * 80)
            if result.error:
                print(f"Error: {result.error}")
            else:
                print(result.content[:500] + "..." if len(result.content) > 500 else result.content)
            print("-" * 80)
    else:
        print("⚠️  Skipping execution (Vertex AI not initialized)")
        print()
        print("Sequential workflow would:")
        print("  1. ResearcherAgent gathers information about Gemini 2.5 Flash")
        print("  2. AnalyzerAgent analyzes the findings and extracts insights")
        print("  3. Results flow from one agent to the next")

    print()
    print("=" * 80)
    print("Demonstration 2: Agent-to-Agent Collaboration")
    print("=" * 80)
    print()

    if orchestrator.vertex_initialized:
        task = "Explain the benefits of multi-agent systems for enterprise AI applications"
        print(f"Task: {task}")
        print()
        print("Collaboration: Researcher → Analyzer")
        print()
        print("Executing collaboration...")

        collaboration_results = researcher.collaborate(analyzer, task)

        for agent_name, result in collaboration_results.items():
            print()
            print(f"{agent_name} Response:")
            print("-" * 80)
            if result.error:
                print(f"Error: {result.error}")
            else:
                print(result.content[:500] + "..." if len(result.content) > 500 else result.content)
            print("-" * 80)
    else:
        print("⚠️  Skipping execution (Vertex AI not initialized)")
        print()
        print("Collaboration would:")
        print("  1. ResearcherAgent researches multi-agent benefits")
        print("  2. Passes findings to AnalyzerAgent")
        print("  3. AnalyzerAgent builds upon and enhances the research")

    print()
    print("=" * 80)
    print("Demonstration 3: Parallel Workflow")
    print("=" * 80)
    print()

    if orchestrator.vertex_initialized:
        parallel_tasks = [
            {
                "agent_name": "ResearcherAgent",
                "task": "Research AI agent deployment patterns on Google Cloud",
                "context": {}
            },
            {
                "agent_name": "AnalyzerAgent",
                "task": "Analyze best practices for AI agent observability and monitoring",
                "context": {}
            }
        ]

        print("Tasks: Multiple independent research and analysis tasks")
        print()
        print("Parallel execution:")
        for i, task in enumerate(parallel_tasks, 1):
            print(f"  Task {i}: {task['agent_name']} - {task['task'][:60]}...")

        print()
        print("Executing parallel workflow...")
        results = orchestrator.execute_parallel_workflow(parallel_tasks)

        for i, result in enumerate(results, 1):
            print()
            print(f"Task {i} Result ({result.agent_name}):")
            print("-" * 80)
            if result.error:
                print(f"Error: {result.error}")
            else:
                print(result.content[:300] + "..." if len(result.content) > 300 else result.content)
            print("-" * 80)
    else:
        print("⚠️  Skipping execution (Vertex AI not initialized)")
        print()
        print("Parallel workflow would:")
        print("  1. ResearcherAgent and AnalyzerAgent work simultaneously")
        print("  2. Each agent processes independent tasks")
        print("  3. Results are collected and can be synthesized")

    print()
    print("=" * 80)
    print("Multi-Agent Demo Complete!")
    print("=" * 80)
    print()
    print("Key Takeaways:")
    print("  • Multiple specialized agents can collaborate on complex tasks")
    print("  • Workflows can be sequential, parallel, or collaborative")
    print("  • Orchestrator coordinates agent interactions")
    print("  • Each agent maintains its own tools and capabilities")
    print()


if __name__ == "__main__":
    main()
