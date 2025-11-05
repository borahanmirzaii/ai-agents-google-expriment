"""
Researcher Agent Implementation

This agent specializes in gathering information from various sources,
particularly web search and external APIs.
"""

import logging
from typing import Any, Dict, Optional

from agents.base_agent import BaseAgent, AgentConfig, AgentResponse, AgentStatus

logger = logging.getLogger(__name__)


class ResearcherAgent(BaseAgent):
    """
    Agent specialized in research and information gathering.

    Capabilities:
    - Web search
    - Data extraction
    - Information synthesis
    - Source citation
    """

    def __init__(self, config: Optional[AgentConfig] = None):
        """
        Initialize the researcher agent.

        Args:
            config: Optional custom configuration. If not provided, uses defaults.
        """
        if config is None:
            config = AgentConfig(
                name="ResearcherAgent",
                model_name="gemini-2.5-flash-preview-5-20",
                temperature=0.5,  # Lower temperature for more factual responses
                system_prompt="""You are a research specialist agent. Your role is to:
                - Search for relevant information on the web
                - Extract and summarize key findings
                - Verify information from multiple sources
                - Provide structured, well-cited research results

                Always be thorough, accurate, and cite your sources when possible."""
            )

        super().__init__(config)

    def process_task(self, task: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Process a research task.

        Args:
            task: The research question or topic
            context: Optional context information

        Returns:
            AgentResponse with research findings
        """
        logger.info(f"Researcher processing task: {task[:100]}...")

        # Format research prompt
        research_prompt = self._format_research_prompt(task, context)

        # Generate response with tools
        response = self.generate_with_tools(research_prompt)

        return response

    def _format_research_prompt(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Format the research prompt with task and context.

        Args:
            task: The research task
            context: Optional context

        Returns:
            Formatted prompt
        """
        prompt = f"Research Task: {task}\n\n"

        if context:
            prompt += "Context:\n"
            for key, value in context.items():
                prompt += f"- {key}: {value}\n"
            prompt += "\n"

        prompt += """
Please conduct thorough research on this topic:

1. Search for relevant and recent information
2. Identify key facts, trends, and insights
3. Verify information from multiple sources when possible
4. Organize findings in a clear, structured format
5. Cite sources where applicable

Provide a comprehensive research report.
"""

        return prompt

    def search_and_summarize(self, query: str, num_results: int = 5) -> str:
        """
        Search for information and provide a summary.

        Args:
            query: Search query
            num_results: Number of results to consider

        Returns:
            Summary of findings
        """
        task = f"Search for and summarize information about: {query} (consider top {num_results} results)"
        response = self.run(task)
        return response.content
