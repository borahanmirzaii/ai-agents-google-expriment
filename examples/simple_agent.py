#!/usr/bin/env python3
"""
Simple Agent Example

This example demonstrates how to create and use a basic agent with Gemini 2.5 Flash.
It shows:
- Agent initialization
- Tool registration
- Task execution
- Response handling
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.base_agent import BaseAgent, AgentConfig, AgentResponse
from tools.web_search import create_web_search_tool


class SimpleAgent(BaseAgent):
    """A simple agent that can answer questions using web search"""

    def process_task(self, task: str, context=None) -> AgentResponse:
        """Process the task using the model with tools"""
        return self.generate_with_tools(task)


def main():
    """Run the simple agent example"""
    print("=" * 80)
    print("Simple Agent Example")
    print("=" * 80)
    print()

    # Check for PROJECT_ID
    project_id = os.getenv("PROJECT_ID")
    if not project_id:
        print("⚠️  Warning: PROJECT_ID not set. Using limited mode.")
        print("   To use full Vertex AI features, set PROJECT_ID environment variable.")
        print("   Example: export PROJECT_ID=your-gcp-project-id")
        print()

    # Create agent configuration
    config = AgentConfig(
        name="SimpleAgent",
        model_name="gemini-2.5-flash-preview-5-20",
        temperature=0.7,
        system_prompt="""You are a helpful AI assistant powered by Google's Gemini model.
        You can search the web for information when needed.
        Be concise, accurate, and helpful in your responses.""",
        project_id=project_id
    )

    # Create the agent
    print("Creating agent...")
    agent = SimpleAgent(config)
    print(f"✓ Agent created: {agent.config.name}")
    print(f"  Model: {agent.config.model_name}")
    print(f"  Temperature: {agent.config.temperature}")
    print()

    # Register web search tool
    print("Registering tools...")
    tool_name, tool_desc, tool_func, tool_params = create_web_search_tool()
    agent.add_tool(tool_name, tool_desc, tool_func, tool_params)
    print(f"✓ Tool registered: {tool_name}")
    print()

    # Example tasks
    tasks = [
        "What is Google Cloud's Vertex AI?",
        "Search for information about the latest features in Gemini 2.5 Flash",
        "What are the benefits of using AI agents in production systems?"
    ]

    # Run tasks
    for i, task in enumerate(tasks, 1):
        print("=" * 80)
        print(f"Task {i}/{len(tasks)}")
        print("=" * 80)
        print(f"Question: {task}")
        print()

        if not agent.vertex_initialized:
            print("⚠️  Skipping task (Vertex AI not initialized)")
            print("   This is a demonstration of the agent structure.")
            print("   Configure PROJECT_ID to run actual tasks.")
            print()
            continue

        print("Processing...")
        response = agent.run(task)

        print()
        print(f"Status: {response.status.value}")
        print()

        if response.error:
            print(f"Error: {response.error}")
        else:
            print("Response:")
            print("-" * 80)
            print(response.content)
            print("-" * 80)

        if response.tool_calls:
            print()
            print(f"Tools used: {len(response.tool_calls)}")
            for j, tool_call in enumerate(response.tool_calls, 1):
                print(f"  {j}. {tool_call['function']}")

        print()

    print("=" * 80)
    print("Example completed!")
    print("=" * 80)


if __name__ == "__main__":
    main()
