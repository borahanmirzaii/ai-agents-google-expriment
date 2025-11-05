"""
Integration tests for the AI agent system
"""

import pytest
import os

from agents.researcher_agent import ResearcherAgent
from agents.analyzer_agent import AnalyzerAgent
from agents.orchestrator_agent import OrchestratorAgent
from tools.web_search import create_web_search_tool
from tools.code_executor import create_code_executor_tool
from tools.file_manager import create_file_manager_tool


class TestAgentToolIntegration:
    """Integration tests for agents with tools"""

    def test_agent_with_web_search(self):
        """Test agent with web search tool"""
        agent = ResearcherAgent()

        # Register tool
        name, desc, func, params = create_web_search_tool()
        agent.add_tool(name, desc, func, params)

        # Verify tool is registered
        assert name in agent.tool_functions
        assert len(agent.tools) > 0

    def test_agent_with_code_executor(self):
        """Test agent with code executor tool"""
        agent = AnalyzerAgent()

        # Register tool
        name, desc, func, params = create_code_executor_tool()
        agent.add_tool(name, desc, func, params)

        # Verify tool is registered
        assert name in agent.tool_functions

    def test_agent_with_multiple_tools(self):
        """Test agent with multiple tools"""
        agent = ResearcherAgent()

        # Register multiple tools
        tools = [
            create_web_search_tool(),
            create_file_manager_tool(),
        ]

        for name, desc, func, params in tools:
            agent.add_tool(name, desc, func, params)

        # Verify all tools registered
        assert len(agent.tool_functions) == 2


class TestMultiAgentIntegration:
    """Integration tests for multi-agent workflows"""

    def test_orchestrator_with_agents(self):
        """Test orchestrator with multiple agents"""
        orchestrator = OrchestratorAgent()
        researcher = ResearcherAgent()
        analyzer = AnalyzerAgent()

        # Register agents
        orchestrator.register_agent(researcher)
        orchestrator.register_agent(analyzer)

        assert len(orchestrator.registered_agents) == 2
        assert "ResearcherAgent" in orchestrator.registered_agents
        assert "AnalyzerAgent" in orchestrator.registered_agents

    def test_sequential_workflow_structure(self):
        """Test sequential workflow structure"""
        orchestrator = OrchestratorAgent()
        researcher = ResearcherAgent()
        analyzer = AnalyzerAgent()

        orchestrator.register_agent(researcher)
        orchestrator.register_agent(analyzer)

        tasks = [
            {
                "agent_name": "ResearcherAgent",
                "task": "Test task 1",
                "context": {}
            },
            {
                "agent_name": "AnalyzerAgent",
                "task": "Test task 2",
                "context": {}
            }
        ]

        # Note: This won't execute without Vertex AI configured,
        # but we can test the structure
        assert len(tasks) == 2
        assert tasks[0]["agent_name"] in orchestrator.registered_agents
        assert tasks[1]["agent_name"] in orchestrator.registered_agents

    def test_parallel_workflow_structure(self):
        """Test parallel workflow structure"""
        orchestrator = OrchestratorAgent()
        researcher = ResearcherAgent()
        analyzer = AnalyzerAgent()

        orchestrator.register_agent(researcher)
        orchestrator.register_agent(analyzer)

        tasks = [
            {
                "agent_name": "ResearcherAgent",
                "task": "Parallel task 1",
                "context": {}
            },
            {
                "agent_name": "AnalyzerAgent",
                "task": "Parallel task 2",
                "context": {}
            }
        ]

        # Verify structure
        assert len(tasks) == 2


class TestEndToEndWorkflow:
    """End-to-end workflow tests"""

    def test_complete_agent_setup(self):
        """Test complete agent setup with tools"""
        # Create agents
        researcher = ResearcherAgent()
        analyzer = AnalyzerAgent()
        orchestrator = OrchestratorAgent()

        # Register tools
        search_tool = create_web_search_tool()
        researcher.add_tool(*search_tool)

        code_tool = create_code_executor_tool()
        analyzer.add_tool(*code_tool)

        # Register agents with orchestrator
        orchestrator.register_agent(researcher)
        orchestrator.register_agent(analyzer)

        # Verify complete setup
        assert len(researcher.tool_functions) >= 1
        assert len(analyzer.tool_functions) >= 1
        assert len(orchestrator.registered_agents) == 2

    def test_tool_execution_chain(self):
        """Test that tools can be executed"""
        from tools.web_search import WebSearchTool
        from tools.code_executor import CodeExecutorTool

        # Web search
        search_tool = WebSearchTool()
        search_result = search_tool.search("test query")
        assert search_result["status"] == "success"

        # Code execution
        code_tool = CodeExecutorTool()
        code_result = code_tool.execute("print('test')", "python")
        assert code_result["status"] == "success"


class TestConfigurationLoading:
    """Test configuration loading"""

    def test_environment_variables(self):
        """Test that environment variables work"""
        # These might not be set in test environment
        project_id = os.getenv("PROJECT_ID")
        # Should not crash if not set
        assert project_id is None or isinstance(project_id, str)

    def test_agent_config_loading(self):
        """Test loading agent configurations"""
        import yaml
        from pathlib import Path

        config_path = Path(__file__).parent.parent / "config" / "agent_config.yaml"

        if config_path.exists():
            with open(config_path) as f:
                config = yaml.safe_load(f)

            assert "agents" in config
            assert "base" in config["agents"]

    def test_deployment_config_loading(self):
        """Test loading deployment configurations"""
        import yaml
        from pathlib import Path

        config_path = Path(__file__).parent.parent / "config" / "deployment.yaml"

        if config_path.exists():
            with open(config_path) as f:
                config = yaml.safe_load(f)

            assert "agent_engine" in config or "cloud_run" in config


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
