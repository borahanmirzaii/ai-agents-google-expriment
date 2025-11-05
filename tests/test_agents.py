"""
Unit tests for agent implementations
"""

import pytest
from unittest.mock import Mock, patch, MagicMock

from agents.base_agent import BaseAgent, AgentConfig, AgentResponse, AgentStatus
from agents.researcher_agent import ResearcherAgent
from agents.analyzer_agent import AnalyzerAgent
from agents.orchestrator_agent import OrchestratorAgent


class TestAgent(BaseAgent):
    """Concrete implementation for testing BaseAgent"""

    def process_task(self, task: str, context=None) -> AgentResponse:
        return AgentResponse(
            agent_name=self.config.name,
            content=f"Processed: {task}",
            status=AgentStatus.COMPLETED
        )


class TestBaseAgent:
    """Tests for BaseAgent class"""

    def test_agent_initialization(self):
        """Test agent initialization"""
        config = AgentConfig(
            name="TestAgent",
            model_name="gemini-2.5-flash-preview-5-20",
            system_prompt="Test prompt"
        )

        agent = TestAgent(config)

        assert agent.config.name == "TestAgent"
        assert agent.status == AgentStatus.IDLE
        assert len(agent.tools) == 0

    def test_tool_registration(self):
        """Test tool registration"""
        config = AgentConfig(name="TestAgent")
        agent = TestAgent(config)

        def dummy_tool(query: str) -> dict:
            return {"result": query}

        tool_params = {
            "type": "object",
            "properties": {
                "query": {"type": "string"}
            }
        }

        agent.add_tool(
            "dummy_tool",
            "A dummy tool",
            dummy_tool,
            tool_params
        )

        assert "dummy_tool" in agent.tool_functions
        assert len(agent.tools) > 0

    def test_run_task(self):
        """Test running a task"""
        config = AgentConfig(name="TestAgent")
        agent = TestAgent(config)

        response = agent.run("test task")

        assert response.agent_name == "TestAgent"
        assert response.status == AgentStatus.COMPLETED
        assert "test task" in response.content

    def test_collaboration(self):
        """Test agent collaboration"""
        config1 = AgentConfig(name="Agent1")
        config2 = AgentConfig(name="Agent2")

        agent1 = TestAgent(config1)
        agent2 = TestAgent(config2)

        results = agent1.collaborate(agent2, "collaborative task")

        assert "Agent1" in results
        assert "Agent2" in results
        assert results["Agent1"].status == AgentStatus.COMPLETED
        assert results["Agent2"].status == AgentStatus.COMPLETED

    def test_preprocess_task(self):
        """Test task preprocessing"""
        config = AgentConfig(name="TestAgent")
        agent = TestAgent(config)

        processed = agent.preprocess_task("raw task", {"key": "value"})

        assert processed == "raw task"

    def test_postprocess_response(self):
        """Test response postprocessing"""
        config = AgentConfig(name="TestAgent")
        agent = TestAgent(config)

        response = AgentResponse(
            agent_name="TestAgent",
            content="test",
            status=AgentStatus.COMPLETED
        )

        processed = agent.postprocess_response(response)

        assert processed.agent_name == "TestAgent"
        assert processed.content == "test"


class TestResearcherAgent:
    """Tests for ResearcherAgent"""

    def test_researcher_initialization(self):
        """Test researcher agent initialization"""
        agent = ResearcherAgent()

        assert agent.config.name == "ResearcherAgent"
        assert agent.config.temperature == 0.5  # Lower for factual responses

    def test_researcher_custom_config(self):
        """Test researcher with custom config"""
        config = AgentConfig(
            name="CustomResearcher",
            temperature=0.3
        )

        agent = ResearcherAgent(config)

        assert agent.config.name == "CustomResearcher"
        assert agent.config.temperature == 0.3


class TestAnalyzerAgent:
    """Tests for AnalyzerAgent"""

    def test_analyzer_initialization(self):
        """Test analyzer agent initialization"""
        agent = AnalyzerAgent()

        assert agent.config.name == "AnalyzerAgent"
        assert agent.config.temperature == 0.3  # Lower for analytical precision

    def test_analyzer_custom_config(self):
        """Test analyzer with custom config"""
        config = AgentConfig(
            name="CustomAnalyzer",
            temperature=0.2
        )

        agent = AnalyzerAgent(config)

        assert agent.config.name == "CustomAnalyzer"
        assert agent.config.temperature == 0.2


class TestOrchestratorAgent:
    """Tests for OrchestratorAgent"""

    def test_orchestrator_initialization(self):
        """Test orchestrator agent initialization"""
        agent = OrchestratorAgent()

        assert agent.config.name == "OrchestratorAgent"
        assert len(agent.registered_agents) == 0

    def test_register_agent(self):
        """Test agent registration"""
        orchestrator = OrchestratorAgent()
        researcher = ResearcherAgent()

        orchestrator.register_agent(researcher)

        assert "ResearcherAgent" in orchestrator.registered_agents
        assert orchestrator.registered_agents["ResearcherAgent"] == researcher

    def test_register_multiple_agents(self):
        """Test registering multiple agents"""
        orchestrator = OrchestratorAgent()
        researcher = ResearcherAgent()
        analyzer = AnalyzerAgent()

        orchestrator.register_agent(researcher)
        orchestrator.register_agent(analyzer)

        assert len(orchestrator.registered_agents) == 2
        assert "ResearcherAgent" in orchestrator.registered_agents
        assert "AnalyzerAgent" in orchestrator.registered_agents

    def test_workflow_plan(self):
        """Test workflow planning"""
        orchestrator = OrchestratorAgent()
        researcher = ResearcherAgent()

        orchestrator.register_agent(researcher)

        plan = orchestrator._plan_workflow("test task")

        assert "task" in plan
        assert "agents_needed" in plan
        assert len(plan["agents_needed"]) > 0


class TestAgentConfig:
    """Tests for AgentConfig dataclass"""

    def test_default_config(self):
        """Test default configuration"""
        config = AgentConfig(name="TestAgent")

        assert config.name == "TestAgent"
        assert config.model_name == "gemini-2.5-flash-preview-5-20"
        assert config.temperature == 0.7
        assert config.max_tokens == 8192

    def test_custom_config(self):
        """Test custom configuration"""
        config = AgentConfig(
            name="CustomAgent",
            model_name="custom-model",
            temperature=0.5,
            max_tokens=4096,
            top_p=0.9
        )

        assert config.name == "CustomAgent"
        assert config.model_name == "custom-model"
        assert config.temperature == 0.5
        assert config.max_tokens == 4096
        assert config.top_p == 0.9


class TestAgentResponse:
    """Tests for AgentResponse dataclass"""

    def test_basic_response(self):
        """Test basic response"""
        response = AgentResponse(
            agent_name="TestAgent",
            content="Test content",
            status=AgentStatus.COMPLETED
        )

        assert response.agent_name == "TestAgent"
        assert response.content == "Test content"
        assert response.status == AgentStatus.COMPLETED
        assert response.error is None

    def test_response_with_tools(self):
        """Test response with tool calls"""
        tool_calls = [
            {"function": "tool1", "args": {}, "result": "result1"}
        ]

        response = AgentResponse(
            agent_name="TestAgent",
            content="Test",
            status=AgentStatus.COMPLETED,
            tool_calls=tool_calls
        )

        assert len(response.tool_calls) == 1
        assert response.tool_calls[0]["function"] == "tool1"

    def test_error_response(self):
        """Test error response"""
        response = AgentResponse(
            agent_name="TestAgent",
            content="",
            status=AgentStatus.FAILED,
            error="Test error"
        )

        assert response.status == AgentStatus.FAILED
        assert response.error == "Test error"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
